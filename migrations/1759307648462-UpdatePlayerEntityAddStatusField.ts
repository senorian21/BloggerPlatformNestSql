import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdatePlayerEntityAddStatusField1759307648462 implements MigrationInterface {
    name = 'UpdatePlayerEntityAddStatusField1759307648462'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."player_status_enum" AS ENUM('Winner', 'Losing', 'Draw')`);
        await queryRunner.query(`ALTER TABLE "player" ADD "status" "public"."player_status_enum"`);
        await queryRunner.query(`ALTER TABLE "question" ALTER COLUMN "correctAnswers" SET DEFAULT '[]'::jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "question" ALTER COLUMN "correctAnswers" SET DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "player" DROP COLUMN "status"`);
        await queryRunner.query(`DROP TYPE "public"."player_status_enum"`);
    }

}
