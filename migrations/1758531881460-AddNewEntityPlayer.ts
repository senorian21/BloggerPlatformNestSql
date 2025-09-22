import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNewEntityPlayer1758531881460 implements MigrationInterface {
    name = 'AddNewEntityPlayer1758531881460'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "player" ("id" SERIAL NOT NULL, "userId" integer NOT NULL, "score" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_65edadc946a7faf4b638d5e8885" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "question" ALTER COLUMN "correctAnswers" SET DEFAULT '[]'::jsonb`);
        await queryRunner.query(`ALTER TABLE "player" ADD CONSTRAINT "FK_7687919bf054bf262c669d3ae21" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "player" DROP CONSTRAINT "FK_7687919bf054bf262c669d3ae21"`);
        await queryRunner.query(`ALTER TABLE "question" ALTER COLUMN "correctAnswers" SET DEFAULT '[]'`);
        await queryRunner.query(`DROP TABLE "player"`);
    }

}
