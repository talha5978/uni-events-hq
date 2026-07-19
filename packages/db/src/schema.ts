import {
	boolean,
	pgTable,
	text,
	timestamp,
	uuid,
	uniqueIndex,
	pgEnum,
	index,
	integer,
	decimal,
	jsonb,
} from "drizzle-orm/pg-core";

// ====================== ENUMS ======================
export const userRoleEnum = pgEnum("user_role", [
	"admin", // Student Affairs
	"society_head", // For permission checks (President, Treasurer etc. will use society role)
	"student",
]);

export const societyRoleEnum = pgEnum("society_role", ["president", "treasurer", "member"]);

export const eventStatusEnum = pgEnum("event_status", [
	"draft",
	"upcoming",
	"ongoing",
	"completed",
	"cancelled",
	"cancel_requested",
]);

export const registrationStatusEnum = pgEnum("registration_status", [
	"pending_verification", // After uploading proof
	"payment_verified",
	"registered",
	"attended",
	"absent",
	"cancelled",
]);

// ====================== TABLES ======================

export const users = pgTable(
	"users",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		email: text("email").notNull().unique(),
		password: text("password").notNull(),
		fullName: text("full_name").notNull(),
		studentId: text("student_id").unique(),
		department: text("department"),
		batch: text("batch"),
		section: text("section"),

		role: userRoleEnum("role").notNull().default("student"),
		isVerified: boolean("is_verified").default(false),

		verifiedAt: timestamp("verified_at", { withTimezone: true }),
		revokedAt: timestamp("revoked_at", { withTimezone: true }),

		avatarUrl: text("avatar_url"),

		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		uniqueIndex("users_email_unique").on(table.email),
		uniqueIndex("users_student_id_unique").on(table.studentId),
		index("users_role_idx").on(table.role),
	],
);

export const societies = pgTable(
	"societies",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		name: text("name").notNull(),
		slug: text("slug").notNull().unique(),
		description: text("description"),
		logoUrl: text("logo_url"),
		bannerUrl: text("banner_url"),
		category: text("category"),

		createdBy: uuid("created_by")
			.references(() => users.id)
			.notNull(),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [uniqueIndex("societies_slug_unique").on(table.slug)],
);

export const societyBankAccounts = pgTable("society_bank_accounts", {
	id: uuid("id").defaultRandom().primaryKey(),
	societyId: uuid("society_id")
		.references(() => societies.id, { onDelete: "cascade" })
		.notNull(),
	accountTitle: text("account_title").notNull(),
	accountNumber: text("account_number").notNull(),
	bankName: text("bank_name").notNull(),
	addedBy: uuid("added_by")
		.references(() => users.id)
		.notNull(), // Treasurer
	isActive: boolean("is_active").default(true),

	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const societyMembers = pgTable(
	"society_members",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		societyId: uuid("society_id")
			.references(() => societies.id, { onDelete: "cascade" })
			.notNull(),
		userId: uuid("user_id")
			.references(() => users.id, { onDelete: "cascade" })
			.notNull(),
		role: societyRoleEnum("role").notNull().default("member"),

		joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [uniqueIndex("society_members_unique").on(table.societyId, table.userId)],
);

export const events = pgTable(
	"events",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		societyId: uuid("society_id")
			.references(() => societies.id, { onDelete: "cascade" })
			.notNull(),

		title: text("title").notNull(),
		description: text("description").notNull(),
		bannerUrl: text("banner_url"),

		eventDate: timestamp("event_date", { withTimezone: true }), // Main date
		hasMultipleSlots: boolean("has_multiple_slots").default(false),
		timeslots: jsonb("timeslots"), // Array of {start, end, label}

		location: text("location"),
		isPaid: boolean("is_paid").default(false),
		ticketPrice: decimal("ticket_price", { precision: 10, scale: 2 }),

		maxParticipants: integer("max_participants"),
		rules: text("rules").array(),
		isMembersOnly: boolean("is_members_only").default(false).notNull(),

		status: eventStatusEnum("status").default("draft").notNull(),
		cancelRequestedBy: uuid("cancel_requested_by").references(() => users.id), // Admin
		cancelRequestNote: text("cancel_request_note"),

		createdBy: uuid("created_by")
			.references(() => users.id)
			.notNull(),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index("events_society_idx").on(table.societyId),
		index("events_date_idx").on(table.eventDate),
	],
);

export const eventRegistrations = pgTable(
	"event_registrations",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		eventId: uuid("event_id")
			.references(() => events.id, { onDelete: "cascade" })
			.notNull(),
		userId: uuid("user_id")
			.references(() => users.id, { onDelete: "cascade" })
			.notNull(),

		selectedTimeslot: jsonb("selected_timeslot"),

		// Payment Proof Flow
		transactionProofUrl: text("transaction_proof_url"), // Screenshot of payment
		paymentVerifiedBy: uuid("payment_verified_by").references(() => users.id),
		paymentVerifiedAt: timestamp("payment_verified_at", { withTimezone: true }),

		status: registrationStatusEnum("status").default("pending_verification").notNull(),
		scannedAt: timestamp("scanned_at", { withTimezone: true }),

		registeredAt: timestamp("registered_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		uniqueIndex("event_registrations_unique").on(table.eventId, table.userId),
		index("registrations_event_idx").on(table.eventId),
	],
);

export const societySubscriptions = pgTable(
	"society_subscriptions",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		societyId: uuid("society_id")
			.references(() => societies.id, { onDelete: "cascade" })
			.notNull(),
		userId: uuid("user_id")
			.references(() => users.id, { onDelete: "cascade" })
			.notNull(),
		subscribedAt: timestamp("subscribed_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [uniqueIndex("subscriptions_unique").on(table.societyId, table.userId)],
);

export const qrCodes = pgTable(
	"qr_codes",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		eventRegistrationId: uuid("event_registration_id")
			.references(() => eventRegistrations.id, { onDelete: "cascade" })
			.notNull(),
		userId: uuid("user_id")
			.references(() => users.id, { onDelete: "cascade" })
			.notNull(),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [uniqueIndex("qr_codes_unique").on(table.eventRegistrationId)],
);

export const schema = {
	userRoleEnum,
	societyRoleEnum,
	eventStatusEnum,
	registrationStatusEnum,
	users,
	societies,
	societyBankAccounts,
	societyMembers,
	events,
	eventRegistrations,
	societySubscriptions,
	qrCodes,
} as const;
