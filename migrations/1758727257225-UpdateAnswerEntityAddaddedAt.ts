import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateAnswerEntityAddaddedAt1758727257225 implements MigrationInterface {
    name = 'UpdateAnswerEntityAddaddedAt1758727257225'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "answer" ADD "addedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "question" ALTER COLUMN "correctAnswers" SET DEFAULT '[]'::jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "question" ALTER COLUMN "correctAnswers" SET DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "answer" DROP COLUMN "addedAt"`);
    }

}
