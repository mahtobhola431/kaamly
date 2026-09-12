# rokdajob — Database Schema Plan (MongoDB / Mongoose)

Conventions: `_id` ObjectId · `createdAt`/`updatedAt` via timestamps · references by
ObjectId · enums stored as SCREAMING_SNAKE strings · soft delete via `deletedAt`.

## Embedded value objects

```ts
GeoLocation {
  formatted   : string          // "Andheri East, Mumbai, Maharashtra"
  state, stateSlug
  district, districtSlug
  city,  citySlug
  locality, localitySlug
  pincode     : string          // 6 digits
  geo         : { type:'Point', coordinates:[lng, lat] }   // 2dsphere
}

WageExpectation { amount:number, type:'PER_DAY'|'PER_HOUR'|'PER_MONTH'|'PER_PIECE', negotiable:boolean }
```

## Collections

### users
| field | type | notes |
|---|---|---|
| email | string, unique, lowercase | required — the primary login identifier |
| username | string, unique, lowercase | required — the alternative login identifier, 3-30 chars, starts with a letter |
| passwordHash | string, `select:false` | bcrypt 12; absent on Google-only accounts |
| providers | [`LOCAL`\|`GOOGLE`] | every linked sign-in method; at least one |
| googleId | string, unique sparse | Google `sub` claim |
| phone | string, unique sparse | optional; 10 digits, no country code |
| role | `WORKER`\|`EMPLOYER`\|`ADMIN` | WORKER = "employee", EMPLOYER = "contractor" |
| approval | `{status, reason?, decidedAt?, decidedBy?}` | `AUTO_APPROVED` for workers/admins, `PENDING`→`APPROVED`\|`REJECTED` for contractors |
| registrationComplete | boolean | false while a Google signup still has to pick a role |
| companyName | string | captured at contractor signup so the approval queue has something to judge |
| name, avatarUrl | string | |
| emailVerifiedAt, phoneVerifiedAt | Date\|null | Google sign-in sets emailVerifiedAt |
| passwordChangedAt | Date | sessions issued before this are rejected |
| passwordResetTokenHash / ...ExpiresAt | `select:false` | SHA-256 of the emailed token, single use |
| emailVerificationTokenHash / ...ExpiresAt | `select:false` | same pattern |
| failedLoginAttempts, lockedUntil | number, Date | 8 failures locks the account for 15 minutes |
| status | `ACTIVE`\|`SUSPENDED`\|`DELETED` | |
| lastActiveAt, lastLoginAt | Date | powers "Recently active" badge |
| adminLevel | `SUPPORT`\|`MODERATOR`\|`SUPER` | only when role=ADMIN; deciding needs MODERATOR+ |

**Indexes** `{email:1} unique` · `{username:1} unique` · `{phone:1} unique sparse`
· `{googleId:1} unique sparse` · `{role:1,status:1}` · `{role:1,'approval.status':1,createdAt:-1}` (approval queue)
· `{lastActiveAt:-1}`

Admins are **seeded, never registered** — no HTTP path grants `role=ADMIN`:
`npm run seed:admin -w @rokdajob/backend -- --email .. --username .. --name .. --password ..`

### workerprofiles  (1‑1 users)
`user` · `headline` · `bio` · `skills:[{skill:ObjectId, years:number, level:'BEGINNER'|'SKILLED'|'EXPERT'}]`
· `primaryCategory` · `experienceYears` · `location:GeoLocation` · `workRadiusKm`
· `expectedWage:WageExpectation` · `availability:'AVAILABLE_NOW'|'AVAILABLE_FROM'|'BUSY'|'NOT_LOOKING'`
· `availableFrom:Date` · `languages:[string]` · `gender` · `dateOfBirth`
· `ratingAvg` · `ratingCount` · `completedJobs` · `verification:{phone,profile,documents:boolean}`
· `profileCompletion:number` · `documents:[ObjectId]` · `deletedAt`

**Indexes** `{user:1} unique` · **`{'location.geo':'2dsphere'}`** · `{'skills.skill':1, availability:1}`
· `{'location.citySlug':1,'location.localitySlug':1}` · `{ratingAvg:-1}` · `{'expectedWage.amount':1}`
· `{availability:1, lastActiveAt:-1}` · text index on `headline,bio`

### employerprofiles (1‑1 users)  &  companies (1‑many)
`employerprofiles`: `user` · `company` · `designation` · `permissions`
`companies`: `name` · `slug` · `type:'CONTRACTOR'|'CONSTRUCTION'|'WAREHOUSE'|'FACTORY'|'MAINTENANCE'|'SMALL_BUSINESS'|'PROPERTY'|'OTHER'`
· `about` · `logoUrl` · `gstin` · `size` · `foundedYear` · `location:GeoLocation`
· `verification:{company,gstin:boolean}` · `ratingAvg` · `ratingCount` · `owner` · `deletedAt`

**Indexes** `{slug:1} unique` · `{owner:1}` · `{'location.geo':'2dsphere'}` · `{'location.citySlug':1}`

### categories / skills   (extensible — §24 is seed data, not code)
`categories`: `name` · `slug` unique · `icon` · `order` · `isActive`
`skills`: `name` · `slug` unique · `category` · `aliases:[string]` (drives text search: "wireman"→Electrician)
· `demandScore` · `isActive`
**Indexes** `{slug:1} unique` · `{category:1,isActive:1}` · `{aliases:1}`

### jobs
`employer(User)` · `company` · `title` · `slug` · `category` · `skills:[ObjectId]`
· `description` · `workersRequired` · `hiredCount` · `location:GeoLocation`
· `startDate` · `endDate` · `durationDays` · `shift:'DAY'|'NIGHT'|'ROTATIONAL'|'FLEXIBLE'`
· `workingHours:{from,to}` · `salary:WageExpectation`
· `perks:{accommodation,food,transport:boolean}` · `experienceRequiredYears`
· `genderPreference:'ANY'|'MALE'|'FEMALE'` (nullable, policy-gated)
· `minAge`/`maxAge` (nullable, policy-gated) · `urgency:'NORMAL'|'URGENT'|'IMMEDIATE'`
· `contactPreference:'IN_APP'|'PHONE'|'BOTH'` · `status` (§12) · `publishedAt` · `expiresAt`
· `viewCount` · `applicationCount` · `deletedAt`

**Indexes** **`{'location.geo':'2dsphere'}`** · `{status:1, publishedAt:-1}` · `{employer:1,status:1,createdAt:-1}`
· `{category:1,status:1}` · `{skills:1,status:1}` · `{'location.citySlug':1,category:1,status:1}` (SEO pages)
· `{urgency:1,publishedAt:-1}` · `{slug:1} unique` · `{expiresAt:1}` TTL-ish sweeper

### applications
`job` · `worker(User)` · `workerProfile` · `employer` · `stage` (§13 pipeline)
· `source:'APPLIED'|'INVITED'` · `coverNote` · `expectedWage` · `stageHistory:[{stage,at,by,note}]`
· `rejectionReason` · `hiredAt` · `withdrawnAt`

**Indexes** **`{job:1, worker:1} unique`** (§43) · `{employer:1,stage:1,createdAt:-1}` · `{worker:1,createdAt:-1}` · `{job:1,stage:1}`

### savedjobs `{worker, job}` unique · shortlists `{employer, workerProfile, job?}` unique
### conversations
`participants:[User]` · `job?` · `application?` · `lastMessage:{text,at,by}` · `unread:{ [userId]: n }`
**Indexes** `{participants:1, 'lastMessage.at':-1}`
### messages
`conversation` · `sender` · `body` · `attachments` · `readBy:[User]` · `createdAt`
**Indexes** `{conversation:1, createdAt:-1}`

### notifications
`user` · `type` · `title` · `body` · `data:{}` · `readAt` · `channel`
**Indexes** `{user:1, createdAt:-1}` · `{user:1, readAt:1}`

### reviews
`job` · `application` · `author` · `subject` · `direction:'EMPLOYER_TO_WORKER'|'WORKER_TO_EMPLOYER'`
· `rating:1-5` · `categories:{workQuality,reliability,communication,punctuality}` · `comment`
**Indexes** **`{job:1, author:1, subject:1} unique`** (§21 no duplicates) · `{subject:1, createdAt:-1}`

### teams / teammembers
`teams`: `employer` · `company` · `name` · `site:GeoLocation` · `activeJob?`
`teammembers`: `team` · `worker` · `roleLabel` ("Mason", "Supervisor") · `joinedAt` · `leftAt` · `status`
**Indexes** `{team:1,status:1}` · `{worker:1}`

### workhistory
`worker` · `employer` · `company` · `job` · `roleLabel` · `from` · `to` · `daysWorked` · `verified`
### documents
`owner` · `type:'AADHAAR'|'PAN'|'LICENSE'|'CERTIFICATE'|'OTHER'` · `url` · `status:'PENDING'|'APPROVED'|'REJECTED'` · `reviewedBy`
### reports  `reporter` · `targetType` · `targetId` · `reason` · `status` · `resolvedBy`
### adminactivities  `admin` · `action` · `targetType` · `targetId` · `before` · `after` · `note` · `ip`  (append-only)
### refreshtokens  `user` · `tokenHash` (SHA-256) · `family` · `expiresAt` · `revokedAt` · `replacedBy` · `userAgent` · `ip`
### otps  `identifier` · `codeHash` · `purpose` · `attempts` · `expiresAt`  (TTL index)
### locations  (hierarchy master)
`type:'COUNTRY'|'STATE'|'DISTRICT'|'CITY'|'LOCALITY'` · `name` · `slug` · `parent` · `pincodes:[string]`
· `geo:Point` · `isActive` · `path:[ObjectId]` (materialised ancestor path)
**Indexes** `{type:1,slug:1} unique` · `{parent:1}` · `{pincodes:1}` · `{geo:'2dsphere'}` · text on `name`

## Key aggregation: nearby workers

```js
db.workerprofiles.aggregate([
  { $geoNear: { near:{type:'Point',coordinates:[lng,lat]}, distanceField:'distanceMeters',
                maxDistance: radiusKm*1000, spherical:true,
                query:{ availability:{$in:[...]}, 'skills.skill':skillId, deletedAt:null } } },
  { $lookup: { from:'users', ... } },
  { $sort: { distanceMeters:1 } }, { $skip }, { $limit }
])
```
`$geoNear` must be the **first** stage — this is why filters go in its `query` option.
