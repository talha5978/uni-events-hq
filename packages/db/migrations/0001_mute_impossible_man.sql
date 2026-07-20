ALTER TABLE "event_registrations" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "event_registrations" ALTER COLUMN "status" SET DEFAULT 'pending_verification'::text;--> statement-breakpoint
DROP TYPE "public"."registration_status";--> statement-breakpoint
CREATE TYPE "public"."registration_status" AS ENUM('pending_verification', 'registered', 'attended', 'absent', 'cancelled');--> statement-breakpoint
ALTER TABLE "event_registrations" ALTER COLUMN "status" SET DEFAULT 'pending_verification'::"public"."registration_status";--> statement-breakpoint
ALTER TABLE "event_registrations" ALTER COLUMN "status" SET DATA TYPE "public"."registration_status" USING "status"::"public"."registration_status";