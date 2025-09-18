import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNewEntityQuestions1758187039063 implements MigrationInterface {
    name = 'AddNewEntityQuestions1758187039063'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "question" ("id" SERIAL NOT NULL, "deletedAt" TIMESTAMP, "body" character varying(500) COLLATE "C" NOT NULL, "correctAnswers" jsonb NOT NULL DEFAULT '[]'::jsonb, "published" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_21e5786aa0ea704ae185a79b2d5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "blog" ADD "isMembershipTest" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "blog" DROP COLUMN "isMembershipTest"`);
        await queryRunner.query(`DROP TABLE "question"`);
    }

}
