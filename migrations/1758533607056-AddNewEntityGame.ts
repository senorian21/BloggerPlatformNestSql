import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNewEntityGame1758533607056 implements MigrationInterface {
    name = 'AddNewEntityGame1758533607056'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."game_status_enum" AS ENUM('PendingSecondPlayer', 'Active', 'Finished')`);
        await queryRunner.query(`CREATE TABLE "game" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "status" "public"."game_status_enum" NOT NULL DEFAULT 'PendingSecondPlayer', "player_1_id" integer NOT NULL, "player_2_id" integer, "pairCreatedDate" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "startGameDate" TIMESTAMP WITH TIME ZONE, "finishGameDate" TIMESTAMP WITH TIME ZONE, CONSTRAINT "REL_dcb90720b513ca1a340285957d" UNIQUE ("player_1_id"), CONSTRAINT "REL_0609c681bc603dcf53509d93d6" UNIQUE ("player_2_id"), CONSTRAINT "PK_352a30652cd352f552fef73dec5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "question" ALTER COLUMN "correctAnswers" SET DEFAULT '[]'::jsonb`);
        await queryRunner.query(`ALTER TABLE "game" ADD CONSTRAINT "FK_dcb90720b513ca1a340285957dc" FOREIGN KEY ("player_1_id") REFERENCES "player"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "game" ADD CONSTRAINT "FK_0609c681bc603dcf53509d93d63" FOREIGN KEY ("player_2_id") REFERENCES "player"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "game" DROP CONSTRAINT "FK_0609c681bc603dcf53509d93d63"`);
        await queryRunner.query(`ALTER TABLE "game" DROP CONSTRAINT "FK_dcb90720b513ca1a340285957dc"`);
        await queryRunner.query(`ALTER TABLE "question" ALTER COLUMN "correctAnswers" SET DEFAULT '[]'`);
        await queryRunner.query(`DROP TABLE "game"`);
        await queryRunner.query(`DROP TYPE "public"."game_status_enum"`);
    }

}
