import { type InferInsertModel, type InferSelectModel, InferEnum } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { schema as db } from "./schema";

export type DbClient = PostgresJsDatabase<typeof db>;

// ====================== ENUM TYPES ======================
export type RawUserRole = InferEnum<typeof db.userRoleEnum>;
export type SocietyRole = InferEnum<typeof db.societyRoleEnum>;
export type EventStatus = InferEnum<typeof db.eventStatusEnum>;
export type UserRole = "admin" | "student" | SocietyRole;
export type RegistrationStatus = InferEnum<typeof db.registrationStatusEnum>;

// ====================== TABLE TYPES ======================

// Users
export type RawUser = InferSelectModel<typeof schema.users>;
export type User = Omit<RawUser, "role"> & {
	role: UserRole;
};
export type NewUser = InferInsertModel<typeof db.users>;

// Societies
export type Society = InferSelectModel<typeof db.societies>;
export type NewSociety = InferInsertModel<typeof db.societies>;

// Society Bank Accounts
export type SocietyBankAccount = InferSelectModel<typeof db.societyBankAccounts>;
export type NewSocietyBankAccount = InferInsertModel<typeof db.societyBankAccounts>;

// Society Members
export type SocietyMember = InferSelectModel<typeof db.societyMembers>;
export type NewSocietyMember = InferInsertModel<typeof db.societyMembers>;

// Events
export type Event = InferSelectModel<typeof db.events>;
export type NewEvent = InferInsertModel<typeof db.events>;

// Event Registrations
export type EventRegistration = InferSelectModel<typeof db.eventRegistrations>;
export type NewEventRegistration = InferInsertModel<typeof db.eventRegistrations>;

// Society Subscriptions
export type SocietySubscription = InferSelectModel<typeof db.societySubscriptions>;
export type NewSocietySubscription = InferInsertModel<typeof db.societySubscriptions>;
