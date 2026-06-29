CREATE TYPE "public"."achievement_category" AS ENUM('frequency', 'milestone', 'pr', 'streak');--> statement-breakpoint
CREATE TYPE "public"."diet_objective" AS ENUM('bulking', 'cutting', 'manutencao', 'recomposicao');--> statement-breakpoint
CREATE TYPE "public"."meal_type" AS ENUM('cafe_manha', 'lanche_manha', 'almoco', 'lanche_tarde', 'jantar', 'ceia');--> statement-breakpoint
CREATE TYPE "public"."saved_ai_workout_type" AS ENUM('calistenia', 'copied', 'musculacao');--> statement-breakpoint
CREATE TABLE "achievements" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"icon" varchar(50) NOT NULL,
	"category" "achievement_category" NOT NULL,
	"requirement" integer NOT NULL,
	"points" integer DEFAULT 10 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "achievements_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "anamneses" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"age" integer,
	"height" varchar(10),
	"currentWeight" varchar(10),
	"targetWeight" varchar(10),
	"gender" varchar(20),
	"primaryGoal" text,
	"secondaryGoals" text,
	"trainingExperience" text,
	"currentTrainingFrequency" varchar(50),
	"previousInjuries" text,
	"medicalRestrictions" text,
	"exerciseRestrictions" text,
	"availableDays" text,
	"sessionDuration" varchar(50),
	"occupation" varchar(100),
	"activityLevel" varchar(50),
	"sleepHours" varchar(20),
	"stressLevel" varchar(20),
	"dietType" varchar(50),
	"supplementation" text,
	"chest" varchar(10),
	"waist" varchar(10),
	"hips" varchar(10),
	"thigh" varchar(10),
	"arm" varchar(10),
	"bodyFat" varchar(10),
	"additionalNotes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cardio_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"cardioDate" date NOT NULL,
	"duration" integer NOT NULL,
	"type" varchar(100) NOT NULL,
	"intensity" varchar(50),
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cardio_recommendations" (
	"id" serial PRIMARY KEY NOT NULL,
	"cycleId" integer NOT NULL,
	"frequency" varchar(100) NOT NULL,
	"duration" varchar(100) NOT NULL,
	"intensity" varchar(100) NOT NULL,
	"timing" varchar(255),
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cycles" (
	"id" serial PRIMARY KEY NOT NULL,
	"cycleNumber" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"startWeek" integer NOT NULL,
	"endWeek" integer NOT NULL,
	"objective" text NOT NULL,
	"focus" varchar(255) NOT NULL,
	"description" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exercise_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"workoutLogId" integer NOT NULL,
	"exerciseId" integer NOT NULL,
	"setNumber" integer NOT NULL,
	"reps" integer NOT NULL,
	"load" numeric(6, 2) NOT NULL,
	"completed" boolean DEFAULT true NOT NULL,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exercises" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"muscleGroupId" integer NOT NULL,
	"description" text,
	"videoUrl" varchar(512),
	"imageUrl" varchar(512),
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "food_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"date" varchar(10) NOT NULL,
	"meal" "meal_type" DEFAULT 'almoco' NOT NULL,
	"name" varchar(255) NOT NULL,
	"calories" integer DEFAULT 0 NOT NULL,
	"protein" numeric(6, 1) DEFAULT '0' NOT NULL,
	"carbs" numeric(6, 1) DEFAULT '0' NOT NULL,
	"fat" numeric(6, 1) DEFAULT '0' NOT NULL,
	"quantity" varchar(50),
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "muscle_groups" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "muscle_groups_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "saved_ai_workouts" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"type" "saved_ai_workout_type" NOT NULL,
	"title" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"athleteName" varchar(255),
	"videoUrl" varchar(512),
	"videoAnalysis" text,
	"focus" varchar(100),
	"duration" integer,
	"difficulty" varchar(50),
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_diets" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"objective" "diet_objective" NOT NULL,
	"content" text NOT NULL,
	"weight" varchar(10),
	"height" varchar(10),
	"age" integer,
	"gender" varchar(20),
	"activityLevel" varchar(50),
	"restrictions" text,
	"preferences" text,
	"targetCalories" integer,
	"targetProtein" integer,
	"targetCarbs" integer,
	"targetFat" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_achievements" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"achievementId" integer NOT NULL,
	"unlockedAt" timestamp DEFAULT now() NOT NULL,
	"progress" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" varchar(10) DEFAULT 'user' NOT NULL,
	"currentWeight" numeric(5, 2),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
--> statement-breakpoint
CREATE TABLE "weight_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"weight" numeric(5, 2) NOT NULL,
	"logDate" date NOT NULL,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workout_exercises" (
	"id" serial PRIMARY KEY NOT NULL,
	"cycleId" integer NOT NULL,
	"workoutTypeId" integer NOT NULL,
	"exerciseId" integer NOT NULL,
	"orderIndex" integer NOT NULL,
	"sets" integer NOT NULL,
	"reps" varchar(100) NOT NULL,
	"initialLoad" numeric(6, 2) NOT NULL,
	"loadProgression" numeric(5, 2) NOT NULL,
	"technique" varchar(255),
	"restTime" varchar(50),
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workout_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"workoutTypeId" integer NOT NULL,
	"cycleId" integer NOT NULL,
	"workoutDate" date NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workout_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"workoutLogId" integer NOT NULL,
	"startTime" timestamp NOT NULL,
	"endTime" timestamp,
	"duration" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workout_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(10) NOT NULL,
	"name" varchar(255) NOT NULL,
	"duration" integer NOT NULL,
	"description" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "workout_types_code_unique" UNIQUE("code")
);
