import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNewEntityGameQuestion1758534223005 implements MigrationInterface {
    name = 'AddNewEntityGameQuestion1758534223005'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "gameQuestion" ("id" SERIAL NOT NULL, "gameId" uuid NOT NULL, "questionId" integer NOT NULL, CONSTRAINT "PK_601407422d089c4e400fe98dcf0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "question" ALTER COLUMN "correctAnswers" SET DEFAULT '[]'::jsonb`);
        await queryRunner.query(`ALTER TABLE "gameQuestion" ADD CONSTRAINT "FK_3a5af0f7f778e48a6958111ec27" FOREIGN KEY ("gameId") REFERENCES "game"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "gameQuestion" ADD CONSTRAINT "FK_c66e6099bf9eff9b8136646494c" FOREIGN KEY ("questionId") REFERENCES "question"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "gameQuestion" DROP CONSTRAINT "FK_c66e6099bf9eff9b8136646494c"`);
        await queryRunner.query(`ALTER TABLE "gameQuestion" DROP CONSTRAINT "FK_3a5af0f7f778e48a6958111ec27"`);
        await queryRunner.query(`ALTER TABLE "question" ALTER COLUMN "correctAnswers" SET DEFAULT '[]'`);
        await queryRunner.query(`DROP TABLE "gameQuestion"`);
    }

}
