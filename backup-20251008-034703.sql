PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'CANDIDATE',
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "country" TEXT,
    "city" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "kycStatus" TEXT DEFAULT 'PENDING'
);
INSERT INTO User VALUES('cmggzvklu0001zthyf1zamjle','dasds@gmail.com','$2b$10$uArrER2u1MSTm5scZJnXHeSg6Ok.nqEDFnpnka7YoShlMnvy1vJC6','CANDIDATE','dasdas','123456','Austria','Rawalpindi','2025-10-07T20:10:45.905+00:00','PENDING');
INSERT INTO User VALUES('cmgh24ygw00019894csxxnpgv','usama@abc.com','$2b$10$jzVRwOOoK6oUdvMRwLAAueDZnDeSHifm.o5AqCyoGNufVVpRHmB1G','CANDIDATE','Usama',NULL,NULL,NULL,'2025-10-07T21:14:03.008+00:00','PENDING');
INSERT INTO User VALUES('cmgh2a91i000114k37czu6sog','test@example.com','$2b$10$pZGicp4kVUGCw8YJDOWLne7eRtkMzcmEjFIJ53iQ0aMNMak7pc1Eq','CANDIDATE','Test registration',NULL,NULL,NULL,'2025-10-07T21:18:09.990+00:00','PENDING');
INSERT INTO User VALUES('cmgh3mxtn0000jc3dw9jazq7m','admin@example.com','$2b$10$akfKzqAyRQa7jmSbhBSVUO.NHQpd0G0r/lI0pmetK/9CWNoakSdr6','ADMIN','System Admin',NULL,NULL,NULL,'2025-10-07T21:56:01.588+00:00','PENDING');
CREATE TABLE IF NOT EXISTS "Question" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "text" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "allowMultiple" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO Question VALUES('cmgh565zf0009m24mnabpy9c0','Question 1','A1',0,'2025-10-07T22:38:58.251+00:00','2025-10-07T22:38:58.251+00:00');
INSERT INTO Question VALUES('cmgh56gi6000cm24m2s9n5yx6','dasdasda','A2',1,'2025-10-07T22:39:11.886+00:00','2025-10-07T22:39:11.886+00:00');
INSERT INTO Question VALUES('cmgh56siy000fm24mg3jm2u6g','d asnd nabs dbnad','B1',1,'2025-10-07T22:39:27.467+00:00','2025-10-07T22:39:27.467+00:00');
INSERT INTO Question VALUES('cmgh574aj000im24mp0kdeas4','dasbdhja sjhda sd','B2',1,'2025-10-07T22:39:42.715+00:00','2025-10-07T22:39:42.715+00:00');
INSERT INTO Question VALUES('cmgh57gb9000lm24mofybd4xf','das dbnas dnba bnda sbd anbsd','C1',0,'2025-10-07T22:39:58.294+00:00','2025-10-07T22:39:58.294+00:00');
INSERT INTO Question VALUES('cmgh581cj000om24mzec4gepd','d asnbd nbas dnbas d','C2',1,'2025-10-07T22:40:25.556+00:00','2025-10-07T22:40:25.556+00:00');
CREATE TABLE IF NOT EXISTS "Option" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "questionId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Option_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO Option VALUES('cmgh565zf000am24mhvnqb9oo','cmgh565zf0009m24mnabpy9c0','ABC',1,0);
INSERT INTO Option VALUES('cmgh565zf000bm24mvhd7fo2o','cmgh565zf0009m24mnabpy9c0','CDE',0,1);
INSERT INTO Option VALUES('cmgh56gi6000dm24m1fjaid7f','cmgh56gi6000cm24m2s9n5yx6','dasdasda',1,0);
INSERT INTO Option VALUES('cmgh56gi6000em24mkgvilu1c','cmgh56gi6000cm24m2s9n5yx6','dasdasdasda',0,1);
INSERT INTO Option VALUES('cmgh56siy000gm24mhpl2g7pn','cmgh56siy000fm24mg3jm2u6g','dsanb dbnasdbn a',1,0);
INSERT INTO Option VALUES('cmgh56siy000hm24mgolsd9xz','cmgh56siy000fm24mg3jm2u6g','d asnmd ban sd',1,1);
INSERT INTO Option VALUES('cmgh574aj000jm24ml2l4mipd','cmgh574aj000im24mp0kdeas4','d asbd ajhsd ajsd',1,0);
INSERT INTO Option VALUES('cmgh574aj000km24mnqmz82j4','cmgh574aj000im24mp0kdeas4','dan sdbna snbd anbsd',0,1);
INSERT INTO Option VALUES('cmgh57gb9000mm24m9zaa0vbi','cmgh57gb9000lm24mofybd4xf','d asnbd abns dnbas d',0,0);
INSERT INTO Option VALUES('cmgh57gb9000nm24mpfg1y2oc','cmgh57gb9000lm24mofybd4xf','das dnb asnbd ,ans dn,abs d',1,1);
INSERT INTO Option VALUES('cmgh581ck000pm24mxe24lffy','cmgh581cj000om24mzec4gepd','da snbd asnb dnba das',1,0);
INSERT INTO Option VALUES('cmgh581ck000qm24mchh7eo6y','cmgh581cj000om24mzec4gepd','dasnbd ansbd nbas d',1,1);
INSERT INTO Option VALUES('cmgh581ck000rm24mw77qwxu7','cmgh581cj000om24mzec4gepd','das dnba ,snbd a,nsbd as',1,2);
INSERT INTO Option VALUES('cmgh581ck000sm24mdern0gdp','cmgh581cj000om24mzec4gepd','da snbdm anbsd nabs dnbad',1,3);
INSERT INTO Option VALUES('cmgh581ck000tm24m5im5chbh','cmgh581cj000om24mzec4gepd','das dnba snbdm ansbd nabs dnbas d',1,4);
CREATE TABLE IF NOT EXISTS "TestSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "durationMin" INTEGER NOT NULL DEFAULT 30,
    "criteria" TEXT NOT NULL DEFAULT '{}',
    "resultCriteria" TEXT NOT NULL DEFAULT '{}',
    "updatedAt" DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS "Attempt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "level" TEXT,
    "certificateId" TEXT,
    "issuedAt" DATETIME,
    "verifySlug" TEXT,
    "region" TEXT,
    CONSTRAINT "Attempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "AttemptItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "allowMultiple" BOOLEAN NOT NULL DEFAULT false,
    "optionIds" TEXT NOT NULL,
    "selectedOptionIds" TEXT NOT NULL DEFAULT '[]',
    "correctOptionIds" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isCorrect" BOOLEAN,
    CONSTRAINT "AttemptItem_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "Attempt" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AttemptItem_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "IdentityVerification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "selfieUrl" TEXT NOT NULL,
    "idDocUrl" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "consentAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" DATETIME,
    "reviewedBy" TEXT,
    "notes" TEXT,
    CONSTRAINT "IdentityVerification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO IdentityVerification VALUES('cmggzvkoe0003zthyer6ku8ok','cmggzvklu0001zthyf1zamjle','/uploads/selfie_6f98d2bb-bba8-4c8e-9a79-acdb1d0011c0.png','/uploads/id_024b1a6a-ebda-4068-8a9d-f2ba6b5e8f62.png','PENDING','2025-10-07T20:10:45.994+00:00','2025-10-07T20:10:45.995+00:00',NULL,NULL,NULL);
INSERT INTO IdentityVerification VALUES('cmgh24yjl000398942ghzhg92','cmgh24ygw00019894csxxnpgv','https://ksyf1dv55jm5puax.public.blob.vercel-storage.com/selfies/4ce684d8-d11c-40a5-b8c6-58b528cc7732.png','https://ksyf1dv55jm5puax.public.blob.vercel-storage.com/id-docs/9e16dcf8-254d-4337-b2df-4747f89641ee.pdf','PENDING','2025-10-07T21:14:03.105+00:00','2025-10-07T21:14:03.106+00:00',NULL,NULL,NULL);
INSERT INTO IdentityVerification VALUES('cmgh2a96x000314k31816xeyd','cmgh2a91i000114k37czu6sog','https://ksyf1dv55jm5puax.public.blob.vercel-storage.com/selfies/d99d076c-80d5-4d2a-a37d-607ecc04d8f6.jpg','https://ksyf1dv55jm5puax.public.blob.vercel-storage.com/id-docs/c06b1e47-cce1-4931-ae08-b16231201a17.pdf','PENDING','2025-10-07T21:18:10.184+00:00','2025-10-07T21:18:10.185+00:00',NULL,NULL,NULL);
DELETE FROM sqlite_sequence;
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Attempt_verifySlug_key" ON "Attempt"("verifySlug");
CREATE UNIQUE INDEX "IdentityVerification_userId_key" ON "IdentityVerification"("userId");
COMMIT;
