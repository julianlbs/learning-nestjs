import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import * as pactum from "pactum";
import { PrismaService } from "../src/prisma/prisma.service";
import { AppModule } from "../src/app.module";
import { AuthDto } from "../src/auth/dto";
import { EditUserDto } from "src/user/dto";
import { CreateBookMarkDto, EditBookMarkDto } from "../src/bookmark/dto";

describe("App e2e", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
    await app.listen(3333);

    prisma = app.get(PrismaService);
    await prisma.cleanDb();
    pactum.request.setBaseUrl("http://localhost:3333");
  });

  afterAll(() => {
    app.close();
  });

  describe("Auth", () => {
    const dto: AuthDto = {
      email: "julianlimalbs@gmail.com",
      password: "hello123",
    };
    describe("Signup", () => {
      it("should throw if email is empty", () => {
        return pactum
          .spec()
          .post("/auth/signup")
          .withBody({
            email: "",
            password: dto.password,
          })
          .expectStatus(400);
      });

      it("should throw if password is empty", () => {
        return pactum
          .spec()
          .post("/auth/signup")
          .withBody({
            email: dto.email,
            password: "",
          })
          .expectStatus(400);
      });

      it("should throw if no body is provided", () => {
        return pactum.spec().post("/auth/signup").expectStatus(400);
      });

      it("should sign-up", () => {
        return pactum
          .spec()
          .post("/auth/signup")
          .withBody(dto)
          .expectStatus(201);
      });
    });

    describe("Signin", () => {
      it("should throw if email is empty", () => {
        return pactum
          .spec()
          .post("/auth/signin")
          .withBody({
            email: "",
            password: dto.password,
          })
          .expectStatus(400);
      });

      it("should throw if password is empty", () => {
        return pactum
          .spec()
          .post("/auth/signin")
          .withBody({
            email: dto.email,
            password: "",
          })
          .expectStatus(400);
      });

      it("should throw if no body is provided", () => {
        return pactum.spec().post("/auth/signin").expectStatus(400);
      });

      it("should sign-in", () => {
        return pactum
          .spec()
          .post("/auth/signin")
          .withBody(dto)
          .expectStatus(200)
          .stores("accessToken", "access_token");
      });
    });
  });

  describe("User", () => {
    describe("Get me", () => {
      it("should get current user", () => {
        return pactum
          .spec()
          .get("/users/me")
          .withHeaders("Authorization", "Bearer $S{accessToken}")
          .expectStatus(200);
      });
    });

    describe("Edit user", () => {
      it("should edit user", () => {
        const dto: EditUserDto = {
          firstName: "Julian",
          email: "julian.bms@gmail.com",
        };

        return pactum
          .spec()
          .patch("/users/")
          .withHeaders("Authorization", "Bearer $S{accessToken}")
          .withBody(dto)
          .expectStatus(200);
      });
    });
  });

  describe("Bookmarks", () => {
    const dto: CreateBookMarkDto = {
      title: "My bookmark",
      link: "https://google.com",
      description: "My bookmark description",
    };

    describe("Get empty bookmarks", () => {
      it("should get bookmarks", () => {
        return pactum
          .spec()
          .get("/bookmarks")
          .withHeaders("Authorization", "Bearer $S{accessToken}")
          .expectStatus(200)
          .expectBody([]);
      });
    });

    describe("Create bookmark", () => {
      it("should create bookmark", () => {
        return pactum
          .spec()
          .post("/bookmarks")
          .withHeaders("Authorization", "Bearer $S{accessToken}")
          .withBody(dto)
          .expectStatus(201)
          .stores("bookmarkId", "id");
      });
    });

    describe("Get bookmarks", () => {
      it("should get bookmarks", () => {
        return pactum
          .spec()
          .get("/bookmarks")
          .withHeaders("Authorization", "Bearer $S{accessToken}")
          .expectStatus(200)
          .expectJsonLength(1);
      });
    });

    describe("Get bookmark by id", () => {
      it("should get bookmark by id", () => {
        return pactum
          .spec()
          .get("/bookmarks/{id}")
          .withPathParams("id", "$S{bookmarkId}")
          .withHeaders("Authorization", "Bearer $S{accessToken}")
          .expectStatus(200)
          .expectBodyContains("$S{bookmarkId}");
      });
    });

    describe("Edit bookmark", () => {
      const editDto: EditBookMarkDto = {
        description: "new description",
      };

      it("should edit bookmark by id", () => {
        return pactum
          .spec()
          .patch("/bookmarks/{id}")
          .withPathParams("id", "$S{bookmarkId}")
          .withHeaders("Authorization", "Bearer $S{accessToken}")
          .withBody(editDto)
          .expectStatus(200)
          .expectBodyContains(editDto.description);
      });
    });

    describe("Delete bookmark", () => {
      it("should delete bookmark by id", () => {
        return pactum
          .spec()
          .delete("/bookmarks/{id}")
          .withPathParams("id", "$S{bookmarkId}")
          .withHeaders("Authorization", "Bearer $S{accessToken}")
          .expectStatus(204);
      });

      it("should get empy bookmarks", () => {
        return pactum
          .spec()
          .get("/bookmarks")
          .withHeaders("Authorization", "Bearer $S{accessToken}")
          .expectStatus(200)
          .expectBody([])
          .inspect();
      });
    });
  });
});
