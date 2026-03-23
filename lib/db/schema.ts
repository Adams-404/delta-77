import { pgTable, text, timestamp, boolean, integer, decimal } from "drizzle-orm/pg-core";

// --- Better Auth Tables ---

export const user = pgTable("user", {
	id: text("id").primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	emailVerified: boolean('email_verified').notNull(),
	image: text('image'),
	createdAt: timestamp('created_at').notNull(),
	updatedAt: timestamp('updated_at').notNull(),
	// Custom fields extended for EsuX
	phoneNumber: text('phone_number').unique(),
	bvnVerified: boolean('bvn_verified').default(false),
	bvnHash: text('bvn_hash'),
});

export const session = pgTable("session", {
	id: text("id").primaryKey(),
	expiresAt: timestamp('expires_at').notNull(),
	token: text('token').notNull().unique(),
	createdAt: timestamp('created_at').notNull(),
	updatedAt: timestamp('updated_at').notNull(),
	userId: text('user_id').notNull().references(() => user.id),
	ipAddress: text('ip_address'),
	userAgent: text('user_agent'),
});

export const account = pgTable("account", {
	id: text("id").primaryKey(),
	accountId: text('account_id').notNull(),
	providerId: text('provider_id').notNull(),
	userId: text('user_id').notNull().references(() => user.id),
	accessToken: text('access_token'),
	refreshToken: text('refresh_token'),
	idToken: text('id_token'),
	expiresAt: timestamp('expires_at'),
	password: text('password'),
	createdAt: timestamp('created_at').notNull(),
	updatedAt: timestamp('updated_at').notNull(),
});

export const verification = pgTable("verification", {
	id: text("id").primaryKey(),
	identifier: text('identifier').notNull(),
	value: text('value').notNull(),
	expiresAt: timestamp('expires_at').notNull(),
	createdAt: timestamp('created_at'),
	updatedAt: timestamp('updated_at'),
});

// --- EsuX Business Logic Tables ---

export const circles = pgTable("circles", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	slug: text("slug").unique(),
	description: text("description"),
	organizerId: text("organizer_id").notNull().references(() => user.id),
	contributionAmount: decimal("contribution_amount", { precision: 15, scale: 2 }).notNull(),
	frequency: text("frequency").notNull(), // enum: weekly | monthly | custom
	maxMembers: integer("max_members").notNull(),
	status: text("status").default("pending").notNull(), // enum: pending | active | paused | completed
	currentRound: integer("current_round").default(1).notNull(),
	startDate: timestamp("start_date"),
	pendingName: text("pending_name"),
	pendingContributionAmount: decimal("pending_contribution_amount", { precision: 15, scale: 2 }),
	approvedBy: text("approved_by").array(), // Array of user IDs approving the change
	rejectedBy: text("rejected_by").array(), // Array of user IDs rejecting the change
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const circleMembers = pgTable("circle_members", {
	id: text("id").primaryKey(),
	circleId: text("circle_id").notNull().references(() => circles.id),
	userId: text("user_id").references(() => user.id), 
	phoneNumber: text("phone_number"), // invite number
	payoutPosition: integer("payout_position"),
	status: text("status").default("invited").notNull(), // enum: invited | accepted | declined | removed
	joinedAt: timestamp("joined_at"),
});

export const rounds = pgTable("rounds", {
	id: text("id").primaryKey(),
	circleId: text("circle_id").notNull().references(() => circles.id),
	roundNumber: integer("round_number").notNull(),
	recipientId: text("recipient_id").notNull().references(() => user.id),
	totalExpected: decimal("total_expected", { precision: 15, scale: 2 }).notNull(),
	totalCollected: decimal("total_collected", { precision: 15, scale: 2 }).default("0").notNull(),
	status: text("status").default("ongoing").notNull(), // enum: ongoing | completed | failed
	payoutSentAt: timestamp("payout_sent_at"),
	startsAt: timestamp("starts_at"),
	endsAt: timestamp("ends_at"),
});

export const contributions = pgTable("contributions", {
	id: text("id").primaryKey(),
	roundId: text("round_id").notNull().references(() => rounds.id),
	memberId: text("member_id").notNull().references(() => user.id),
	amountExpected: decimal("amount_expected", { precision: 15, scale: 2 }).notNull(),
	amountPaid: decimal("amount_paid", { precision: 15, scale: 2 }).default("0").notNull(),
	transactionRef: text("transaction_ref"),
	paymentVerified: boolean("payment_verified").default(false).notNull(),
	coversRounds: integer("covers_rounds").array(), // integer array supported in PG
	paidAt: timestamp("paid_at"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
	id: text("id").primaryKey(),
	userId: text("user_id").references(() => user.id),
	phoneNumber: text("phone_number"),
	role: text("role").notNull(), // enum: user | assistant
	content: text("content").notNull(),
	channel: text("channel").notNull(), // enum: web | whatsapp
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
	id: text("id").primaryKey(),
	userId: text("user_id").notNull().references(() => user.id),
	circleId: text("circle_id").references(() => circles.id),
	type: text("type").notNull(), // enum: reminder | payment_received | payout_sent | member_joined | member_declined
	message: text("message").notNull(),
	read: boolean("read").default(false).notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});
