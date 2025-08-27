-- CreateTable
CREATE TABLE "public"."Book" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Book_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProfileBook" (
    "profileId" TEXT NOT NULL,
    "valueId" TEXT NOT NULL,

    CONSTRAINT "ProfileBook_pkey" PRIMARY KEY ("profileId","valueId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Book_name_key" ON "public"."Book"("name");

-- AddForeignKey
ALTER TABLE "public"."ProfileBook" ADD CONSTRAINT "ProfileBook_valueId_fkey" FOREIGN KEY ("valueId") REFERENCES "public"."Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProfileBook" ADD CONSTRAINT "ProfileBook_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "public"."Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
