import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNewEntityAnswer1758532590058 implements MigrationInterface {
    name = 'AddNewEntityAnswer1758532590058'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."answer_answerstatus_enum" AS ENUM('Correct', 'Incorrect')`);
        await queryRunner.query(`CREATE TABLE "answer" ("id" SERIAL NOT NULL, "body" character varying(300) NOT NULL, "answerStatus" "public"."answer_answerstatus_enum" NOT NULL, "playerId" integer NOT NULL, CONSTRAINT "PK_9232db17b63fb1e94f97e5c224f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "question" ALTER COLUMN "correctAnswers" SET DEFAULT '[]'::jsonb`);
        await queryRunner.query(`ALTER TABLE "answer" ADD CONSTRAINT "FK_5c486122f6925ef0e8fefd5fc75" FOREIGN KEY ("playerId") REFERENCES "player"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "answer" DROP CONSTRAINT "FK_5c486122f6925ef0e8fefd5fc75"`);
        await queryRunner.query(`ALTER TABLE "question" ALTER COLUMN "correctAnswers" SET DEFAULT '[]'`);
        await queryRunner.query(`DROP TABLE "answer"`);
        await queryRunner.query(`DROP TYPE "public"."answer_answerstatus_enum"`);
    }

}
