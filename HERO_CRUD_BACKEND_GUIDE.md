# HERO SECTION - BACKEND CRUD OPERATIONS COMPLETE GUIDE

## 📁 Files Created

### 1. Migration File
**Path**: `D:\PROJECTS\BE\src\migrations\createHeroSectionTable.js`
- Creates `hero_section` table in database
- Inserts default hero section
- Run with: `npm run create:hero-table`

### 2. Model File
**Path**: `D:\PROJECTS\BE\src\models\HeroSection.js`
- Database operations using MSSQL
- Methods:
  * `getActive()` - Get currently active hero
  * `findAll()` - Get all heroes (admin)
  * `findById(id)` - Get hero by ID
  * `create(heroData)` - Create new hero
  * `update(id, heroData)` - Update hero
  * `delete(id)` - Delete hero
  * `setActive(id)` - Set hero as active

### 3. Controller File
**Path**: `D:\PROJECTS\BE\src\controllers\heroController.js`
- Business logic for all CRUD operations
- Functions:
  * `getActive` - Public: Get active hero
  * `getAll` - Admin: Get all heroes
  * `getById` - Admin: Get hero by ID
  * `create` - Admin: Create new hero with image upload
  * `update` - Admin: Update hero with optional new image
  * `delete` - Admin: Delete hero and its image
  * `setActive` - Admin: Activate a hero

### 4. Routes File
**Path**: `D:\PROJECTS\BE\src\routes\heroRoutes.js`
- URL endpoints configuration
- Multer setup for image uploads
- Authentication & authorization middleware

### 5. Server.js (Updated)
**Path**: `D:\PROJECTS\BE\server.js`
- Added: `const heroRoutes = require('./src/routes/heroRoutes');`
- Added: `app.use('/api/hero', heroRoutes);`

### 6. Package.json (Updated)
**Path**: `D:\PROJECTS\BE\package.json`
- Added script: `"create:hero-table": "node src/migrations/createHeroSectionTable.js"`

---

## 🗄️ Database Schema

```sql
CREATE TABLE hero_section (
    id INT PRIMARY KEY IDENTITY(1,1),
    title NVARCHAR(MAX) NOT NULL,
    image NVARCHAR(500) NULL,
    is_active BIT DEFAULT 1,
    created_by INT NOT NULL,
    created_date DATETIME DEFAULT GETDATE(),
    modified_date DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_hero_section_created_by 
        FOREIGN KEY (created_by) REFERENCES tbl_users(id)
)
```

---

## 🔌 API Endpoints

### Public Endpoint

#### 1. Get Active Hero Section
```
GET /api/hero/active
```
**Description**: Get currently active hero section (no authentication required)

**Response**:
```json
{
  "id": 1,
  "title": "Group of company has created...",
  "image": "/uploads/hero/hero-1234567890.jpg",
  "is_active": true,
  "created_by": 1,
  "created_by_username": "admin",
  "created_date": "2025-01-15T10:30:00",
  "modified_date": "2025-01-15T10:30:00"
}
```

---

### Admin Endpoints (Require Authentication + Admin Role)

#### 2. Get All Hero Sections
```
GET /api/hero/all
Headers: { Authorization: "Bearer <token>" }
```
**Description**: Get all hero sections including inactive ones

**Response**:
```json
[
  {
    "id": 1,
    "title": "Active Hero",
    "image": "/uploads/hero/hero-1234567890.jpg",
    "is_active": true,
    "created_by": 1,
    "created_by_username": "admin",
    "created_date": "2025-01-15T10:30:00"
  },
  {
    "id": 2,
    "title": "Inactive Hero",
    "image": "/uploads/hero/hero-9876543210.jpg",
    "is_active": false,
    "created_by": 1,
    "created_by_username": "admin",
    "created_date": "2025-01-14T09:20:00"
  }
]
```

#### 3. Get Hero Section by ID
```
GET /api/hero/:id
Headers: { Authorization: "Bearer <token>" }
```
**Description**: Get single hero section details

**Response**: Same as #2 but single object

#### 4. Create Hero Section
```
POST /api/hero
Headers: { 
  Authorization: "Bearer <token>",
  Content-Type: "multipart/form-data"
}
Body (FormData): {
  title: "New hero title",
  image: <File>
}
```
**Description**: Create new hero section (automatically set as active)

**Response**:
```json
{
  "message": "Hero section created successfully",
  "hero": {
    "id": 3,
    "title": "New hero title",
    "image": "/uploads/hero/hero-1234567890.jpg",
    "is_active": true,
    "created_by": 1
  }
}
```

#### 5. Update Hero Section
```
PUT /api/hero/:id
Headers: { 
  Authorization: "Bearer <token>",
  Content-Type: "multipart/form-data"
}
Body (FormData): {
  title: "Updated title",
  is_active: true,
  image: <File> (optional)
}
```
**Description**: Update hero section details and/or image

**Response**:
```json
{
  "message": "Hero section updated successfully",
  "hero": {
    "id": 1,
    "title": "Updated title",
    "image": "/uploads/hero/hero-new-image.jpg",
    "is_active": true
  }
}
```

#### 6. Set Active Hero Section
```
PUT /api/hero/:id/activate
Headers: { Authorization: "Bearer <token>" }
```
**Description**: Set a hero section as active (deactivates all others)

**Response**:
```json
{
  "message": "Hero section activated successfully",
  "hero": {
    "id": 2,
    "is_active": true
  }
}
```

#### 7. Delete Hero Section
```
DELETE /api/hero/:id
Headers: { Authorization: "Bearer <token>" }
```
**Description**: Delete hero section (cannot delete active hero)

**Response**:
```json
{
  "message": "Hero section deleted successfully"
}
```

---

## 🔐 Security Features

1. **Authentication Required**: All admin endpoints require JWT token
2. **Authorization**: Only admin role can access management endpoints
3. **File Upload Security**:
   - Only image files allowed (image/*)
   - Max file size: 5MB
   - Unique filenames to prevent conflicts
   - Files stored in `/uploads/hero/` directory

4. **Validation**:
   - Title is required
   - Cannot delete active hero section
   - Image validation (type and size)

---

## 🎯 Business Logic

### Active Hero Management
- **Only ONE hero can be active at a time**
- When creating a new hero → automatically becomes active
- When updating to active → deactivates all others
- When using setActive endpoint → deactivates all others

### Image Management
- Images stored in `/uploads/hero/` directory
- Old images automatically deleted when updating
- External URLs (starting with http) are preserved
- Images deleted when hero section is deleted

---

## 📝 Setup Steps

### Step 1: Create Database Table
```bash
cd D:\PROJECTS\BE
npm run create:hero-table
```

### Step 2: Verify Files Created
Check that all these files exist:
- `src/migrations/createHeroSectionTable.js`
- `src/models/HeroSection.js`
- `src/controllers/heroController.js`
- `src/routes/heroRoutes.js`

### Step 3: Restart Server
```bash
npm start
```

### Step 4: Test Endpoints
Use Postman or any API client to test the endpoints

---

## 🧪 Testing Checklist

### Public Endpoint Test
- [ ] GET `/api/hero/active` returns active hero

### Admin Tests (Login as admin first)
- [ ] GET `/api/hero/all` returns all heroes
- [ ] POST `/api/hero` creates new hero with image
- [ ] PUT `/api/hero/:id` updates hero
- [ ] PUT `/api/hero/:id/activate` sets hero as active
- [ ] DELETE `/api/hero/:id` deletes inactive hero
- [ ] Try deleting active hero (should fail)

---

## ⚠️ Important Notes

1. **Admin User Required**: You must have an admin user in database to create hero sections
2. **Upload Directory**: The `/uploads/hero/` directory is created automatically
3. **CORS**: Uploads are accessible via `/uploads` static route with CORS enabled
4. **Rate Limiting**: In production, rate limiting applies to API endpoints
5. **Only One Active**: System enforces only one active hero at any time

---

## 🐛 Troubleshooting

### Error: "No active hero section found"
- Run migration to create default hero section
- Or create a new hero section via admin panel

### Error: "Cannot delete active hero section"
- Activate another hero section first
- Then delete the previous one

### Error: "Only image files are allowed"
- Ensure you're uploading image files (jpg, png, gif, etc.)
- Check file MIME type

### Images not displaying
- Check if `/uploads` directory has proper permissions
- Verify CORS settings in server.js
- Check image path in database

---

## 📚 Code Examples

### Creating Hero via API (JavaScript)
```javascript
const formData = new FormData();
formData.append('title', 'New Hero Title');
formData.append('image', imageFile);

const response = await fetch('http://localhost:5000/api/hero', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const data = await response.json();
console.log(data);
```

### Getting Active Hero (JavaScript)
```javascript
const response = await fetch('http://localhost:5000/api/hero/active');
const hero = await response.json();
console.log(hero.title, hero.image);
```

---

## ✅ Summary

All backend CRUD operations for Hero Section are now complete:
- ✅ Database table created
- ✅ Model with all database operations
- ✅ Controller with business logic
- ✅ Routes with authentication
- ✅ Image upload functionality
- ✅ Security and validation
- ✅ Integrated with server.js

**Ready to use!** 🚀
