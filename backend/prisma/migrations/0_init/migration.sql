-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('active', 'claimed', 'grace_period', 'completed', 'cancelled', 'no_show', 'resold', 'payment_failed');

-- CreateEnum
CREATE TYPE "SeatType" AS ENUM ('indoor', 'outdoor', 'bar', 'private_room', 'terrace', 'any');

-- CreateTable
CREATE TABLE "Restaurant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "cuisine" TEXT NOT NULL,
    "neighborhood" TEXT NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "priceLevel" INTEGER NOT NULL,
    "image" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "tags" JSONB NOT NULL DEFAULT '[]',
    "timesBookedOnReslot" INTEGER NOT NULL DEFAULT 0,
    "demandMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "seatType" TEXT NOT NULL,
    "instagram" TEXT,
    "website" TEXT,
    "vibeTags" JSONB NOT NULL DEFAULT '[]',
    "goodForTags" JSONB NOT NULL DEFAULT '[]',
    "foodTags" JSONB NOT NULL DEFAULT '[]',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "isExclusive" BOOLEAN NOT NULL DEFAULT false,
    "city" TEXT NOT NULL DEFAULT 'Stockholm',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Restaurant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reservation" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "submitterPhone" TEXT NOT NULL,
    "submitterFirstName" TEXT NOT NULL,
    "submitterLastName" TEXT NOT NULL,
    "reservationDate" TIMESTAMP(3) NOT NULL,
    "reservationTime" TEXT NOT NULL,
    "partySize" INTEGER NOT NULL,
    "seatType" TEXT NOT NULL,
    "nameOnReservation" TEXT NOT NULL,
    "status" "ReservationStatus" NOT NULL DEFAULT 'active',
    "claimerPhone" TEXT,
    "claimedAt" TIMESTAMP(3),
    "graceDeadline" TIMESTAMP(3),
    "creditStatus" TEXT NOT NULL DEFAULT 'none',
    "serviceFee" DOUBLE PRECISION,
    "stripePaymentIntentId" TEXT,
    "captureStatus" TEXT NOT NULL DEFAULT 'none',
    "cancelFee" DOUBLE PRECISION,
    "prepaidAmount" DOUBLE PRECISION,
    "verificationLink" TEXT,
    "extraInfo" TEXT,
    "cancellationWindowHours" INTEGER,
    "creditCost" INTEGER NOT NULL DEFAULT 2,
    "noShowFeeCharged" BOOLEAN NOT NULL DEFAULT false,
    "noShowFeePaymentIntentId" TEXT,
    "resoldFromId" TEXT,
    "reminderSent" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "avatar" TEXT,
    "credits" INTEGER NOT NULL DEFAULT 0,
    "selectedCity" TEXT NOT NULL DEFAULT 'Stockholm',
    "dateOfBirth" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "phoneVerified" BOOLEAN NOT NULL DEFAULT true,
    "referralCode" TEXT,
    "referralUsed" TEXT,
    "stripeCustomerId" TEXT,
    "pushToken" TEXT,
    "trustScore" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "totalFeedbacks" INTEGER NOT NULL DEFAULT 0,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Watch" (
    "id" TEXT NOT NULL,
    "userPhone" TEXT NOT NULL,
    "restaurantId" TEXT,
    "date" TEXT,
    "partySize" INTEGER,
    "notes" TEXT,
    "filterOptions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Watch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RestaurantAlert" (
    "id" TEXT NOT NULL,
    "userPhone" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RestaurantAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityAlert" (
    "id" TEXT NOT NULL,
    "userPhone" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "restaurantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtpCode" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OtpCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NoShowReport" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "reporterPhone" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "evidenceUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NoShowReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcessedEvent" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcessedEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedRestaurant" (
    "id" TEXT NOT NULL,
    "userPhone" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedRestaurant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailVerification" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RestaurantCache" (
    "placeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "neighborhood" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "rating" DOUBLE PRECISION,
    "reviewCount" INTEGER,
    "priceLevel" INTEGER,
    "cuisine" TEXT,
    "imageUrl" TEXT,
    "website" TEXT,
    "instagram" TEXT,
    "phone" TEXT,
    "openingHours" TEXT,
    "tags" TEXT,
    "rawGoogleData" TEXT,
    "cachedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RestaurantCache_pkey" PRIMARY KEY ("placeId")
);

-- CreateTable
CREATE TABLE "ReservationReport" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "reporterPhone" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReservationReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReservationFeedback" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "userPhone" TEXT NOT NULL,
    "worked" BOOLEAN NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReservationFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Restaurant_city_cuisine_neighborhood_idx" ON "Restaurant"("city", "cuisine", "neighborhood");

-- CreateIndex
CREATE INDEX "Reservation_status_idx" ON "Reservation"("status");

-- CreateIndex
CREATE INDEX "Reservation_submitterPhone_idx" ON "Reservation"("submitterPhone");

-- CreateIndex
CREATE INDEX "Reservation_claimerPhone_idx" ON "Reservation"("claimerPhone");

-- CreateIndex
CREATE INDEX "Reservation_restaurantId_idx" ON "Reservation"("restaurantId");

-- CreateIndex
CREATE INDEX "Reservation_reservationDate_idx" ON "Reservation"("reservationDate");

-- CreateIndex
CREATE INDEX "Reservation_status_claimedAt_idx" ON "Reservation"("status", "claimedAt");

-- CreateIndex
CREATE INDEX "Reservation_restaurantId_reservationDate_status_idx" ON "Reservation"("restaurantId", "reservationDate", "status");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_phone_key" ON "UserProfile"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_referralCode_key" ON "UserProfile"("referralCode");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_stripeCustomerId_key" ON "UserProfile"("stripeCustomerId");

-- CreateIndex
CREATE INDEX "Watch_userPhone_idx" ON "Watch"("userPhone");

-- CreateIndex
CREATE INDEX "Watch_restaurantId_idx" ON "Watch"("restaurantId");

-- CreateIndex
CREATE INDEX "RestaurantAlert_restaurantId_idx" ON "RestaurantAlert"("restaurantId");

-- CreateIndex
CREATE INDEX "RestaurantAlert_userPhone_idx" ON "RestaurantAlert"("userPhone");

-- CreateIndex
CREATE INDEX "ActivityAlert_userPhone_idx" ON "ActivityAlert"("userPhone");

-- CreateIndex
CREATE INDEX "ActivityAlert_userPhone_read_idx" ON "ActivityAlert"("userPhone", "read");

-- CreateIndex
CREATE INDEX "OtpCode_phone_used_idx" ON "OtpCode"("phone", "used");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_phone_idx" ON "Session"("phone");

-- CreateIndex
CREATE INDEX "SavedRestaurant_userPhone_idx" ON "SavedRestaurant"("userPhone");

-- CreateIndex
CREATE UNIQUE INDEX "SavedRestaurant_userPhone_restaurantId_key" ON "SavedRestaurant"("userPhone", "restaurantId");

-- CreateIndex
CREATE INDEX "EmailVerification_phone_used_idx" ON "EmailVerification"("phone", "used");

-- CreateIndex
CREATE INDEX "EmailVerification_email_used_idx" ON "EmailVerification"("email", "used");

-- CreateIndex
CREATE INDEX "RestaurantCache_city_idx" ON "RestaurantCache"("city");

-- CreateIndex
CREATE INDEX "RestaurantCache_name_idx" ON "RestaurantCache"("name");

-- CreateIndex
CREATE INDEX "RestaurantCache_expiresAt_idx" ON "RestaurantCache"("expiresAt");

-- CreateIndex
CREATE INDEX "ReservationReport_reservationId_idx" ON "ReservationReport"("reservationId");

-- CreateIndex
CREATE INDEX "ReservationReport_reporterPhone_idx" ON "ReservationReport"("reporterPhone");

-- CreateIndex
CREATE UNIQUE INDEX "ReservationFeedback_reservationId_key" ON "ReservationFeedback"("reservationId");

-- CreateIndex
CREATE INDEX "ReservationFeedback_userPhone_idx" ON "ReservationFeedback"("userPhone");

-- CreateIndex
CREATE INDEX "ReservationFeedback_reservationId_idx" ON "ReservationFeedback"("reservationId");

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Watch" ADD CONSTRAINT "Watch_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RestaurantAlert" ADD CONSTRAINT "RestaurantAlert_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NoShowReport" ADD CONSTRAINT "NoShowReport_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedRestaurant" ADD CONSTRAINT "SavedRestaurant_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservationReport" ADD CONSTRAINT "ReservationReport_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservationFeedback" ADD CONSTRAINT "ReservationFeedback_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

