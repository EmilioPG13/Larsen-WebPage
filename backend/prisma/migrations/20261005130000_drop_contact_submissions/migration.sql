-- The legacy contact form was replaced by the quote form (leads). Nothing
-- writes to or reads from this table any more.

-- DropForeignKey
ALTER TABLE "contact_submissions" DROP CONSTRAINT "contact_submissions_productId_fkey";

-- DropTable
DROP TABLE "contact_submissions";
