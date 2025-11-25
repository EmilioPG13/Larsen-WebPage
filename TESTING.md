# Testing Guide - Larsen WebPage

This document provides comprehensive manual testing procedures for the Larsen WebPage application.

## Prerequisites

Before starting testing, ensure:
- Backend server is running on `http://localhost:3001`
- Frontend server is running on `http://localhost:3000`
- Database is set up and seeded
- Admin credentials are available for testing

## 1. Quote Form Submission Flow

### Location
Public site: Navigate to `/quote` page

### Test Steps

#### 1.1 Complete Form Submission
1. Navigate to the quote page
2. **Step 1 - Personal Info:**
   - Fill in Name: "John Doe"
   - Fill in Email: "john.doe@example.com"
   - Fill in Phone: "+1 (555) 123-4567"
   - Fill in Company: "Test Company Inc."
   - Click "Siguiente →"
3. **Step 2 - Industry:**
   - Select an industry (e.g., "Textil y Confección") or skip
   - Click "Siguiente →"
4. **Step 3 - Production Volume:**
   - Enter production volume description or skip
   - Click "Siguiente →"
5. **Step 4 - Budget:**
   - Select a budget range (required)
   - Click "Siguiente →"
6. **Step 5 - Purchase Date:**
   - Select a purchase date option (required)
   - Click "Siguiente →"
7. **Step 6 - Message:**
   - Enter optional message or skip
   - Review the summary
   - Click "Enviar Solicitud"

### Expected Results
- ✅ Success message appears: "¡Solicitud Enviada!"
- ✅ Form resets after 3 seconds
- ✅ No console errors
- ✅ Network request to `POST /api/leads` returns 201 status
- ✅ Lead data is correctly formatted in request body

### Verification
- Open browser DevTools → Network tab
- Check the POST request to `/api/leads`
- Verify request payload contains all submitted data
- Check response status is 201

---

## 2. Leads Appearing in Admin Panel

### Location
Admin panel: Navigate to `/admin/leads` (requires authentication)

### Test Steps

#### 2.1 Access Admin Panel
1. Navigate to `/admin/login`
2. Enter admin credentials
3. Click "Login"
4. Verify redirect to admin dashboard

#### 2.2 View Leads
1. Navigate to "Leads" page from admin menu
2. Verify the lead submitted in Section 1 appears in the list
3. Check the following fields are displayed:
   - Name
   - Email
   - Phone
   - Company
   - Status (should be "Nuevo")
   - Date

#### 2.3 View Lead Details
1. Click "Ver detalles" on any lead
2. Verify sidebar displays:
   - All personal information
   - Industry (if provided)
   - Production volume (if provided)
   - Budget
   - Purchase date
   - Message (if provided)

#### 2.4 Test Status Filter
1. Use the status filter dropdown
2. Select "Nuevo" - verify only new leads appear
3. Select "Contactado" - verify only contacted leads appear
4. Select "Convertido" - verify only converted leads appear
5. Select "Archivado" - verify only archived leads appear
6. Select "Todos los estados" - verify all leads appear

#### 2.5 Update Lead Status
1. Select a lead from the list
2. In the details sidebar, change status using dropdown
3. Verify status updates in the table immediately
4. Refresh page and verify status persists

### Expected Results
- ✅ All submitted leads appear in the list
- ✅ Lead details are complete and accurate
- ✅ Status filter works correctly
- ✅ Status updates persist after refresh

---

## 3. Inventory Updates

### Location
Admin panel: `/admin/products` and `/admin/machines`

### Test Steps - Products

#### 3.1 Update Product Stock
1. Navigate to `/admin/products`
2. Find a product in the list
3. Click "Gestionar" on a product
4. In the inventory manager sidebar:
   - Note current stock status
   - Click toggle button to change status
   - Verify status updates in the table
5. Test quantity-based update:
   - Enter quantity: 0
   - Click "Actualizar"
   - Verify product shows "No disponible"
   - Enter quantity: 5
   - Click "Actualizar"
   - Verify product shows "En Stock"

### Test Steps - Machines

#### 3.2 Update Machine Stock
1. Navigate to `/admin/machines`
2. Find a machine in the list
3. Click "Gestionar" on a machine
4. In the inventory manager sidebar:
   - Note current stock status
   - Click toggle button to change status
   - Verify status updates in the table
5. Test quantity-based update:
   - Enter quantity: 0
   - Click "Actualizar"
   - Verify machine shows "No disponible"
   - Enter quantity: 1
   - Click "Actualizar"
   - Verify machine shows "En Stock"

### Expected Results
- ✅ Stock status updates immediately in table
- ✅ Toggle button changes status correctly
- ✅ Quantity = 0 marks item as out of stock
- ✅ Quantity > 0 marks item as in stock
- ✅ Changes persist after page refresh

---

## 4. Frontend Stock Badge Display

### Location
Public site: Products and Machines pages

### Test Steps - Products Page

#### 4.1 Verify Product Badges
1. Navigate to products page (homepage or dedicated products page)
2. For products with `inStock: true`:
   - Verify green badge displays: "En Stock"
   - Badge should be `bg-green-600 text-white`
3. For products with `inStock: false`:
   - Verify gray badge displays: "No disponible"
   - Badge should be `bg-gray-500 text-white`
4. Refresh page and verify badges persist

### Test Steps - Machines Page

#### 4.2 Verify Machine Badges
1. Navigate to `/machines` page
2. For machines with `inStock: true`:
   - Verify badge displays: "✓ En Stock"
   - Badge should be `bg-green-100 text-green-700`
3. For machines with `inStock: false`:
   - Verify badge displays: "✗ No disponible"
   - Badge should be `bg-gray-200 text-gray-700`
   - Verify warning message displays: "⚠️ No disponible actualmente en almacén"
   - Warning should be in red box: `bg-red-50 border border-red-200`
4. Verify "Me interesa" button is disabled for out-of-stock machines
5. Refresh page and verify all badges and messages persist

### Expected Results
- ✅ Correct badges display for all stock statuses
- ✅ Warning messages appear for out-of-stock machines
- ✅ Badges persist after page refresh
- ✅ Buttons are disabled for out-of-stock items

---

## 5. Edge Cases - Empty States

### Test Steps

#### 5.1 Empty Leads List
1. Clear all leads from database (or use test database)
2. Navigate to `/admin/leads`
3. Verify appropriate empty state message displays
4. Verify no errors in console

#### 5.2 Empty Products List
1. Clear all products from database
2. Navigate to `/admin/products`
3. Verify appropriate empty state message displays
4. Verify no errors in console

#### 5.3 Empty Machines List
1. Clear all machines from database
2. Navigate to `/admin/machines`
3. Verify appropriate empty state message displays
4. Verify no errors in console

### Expected Results
- ✅ Empty states display user-friendly messages
- ✅ No console errors
- ✅ UI remains functional

---

## 6. Edge Cases - Error Handling

### Test Steps

#### 6.1 Form Validation Errors
1. Navigate to `/quote`
2. Try to proceed from Step 1 without filling required fields
   - Expected: "Siguiente" button should be disabled
3. Fill invalid email format (e.g., "invalid-email")
   - Expected: Browser validation should prevent submission
4. Try to submit form without budget selection
   - Expected: Cannot proceed to next step
5. Try to submit form without purchase date selection
   - Expected: Cannot proceed to final step

#### 6.2 API Error Scenarios
1. Stop the backend server
2. Try to submit quote form
   - Expected: Error message displays: "Error al enviar la solicitud. Por favor, inténtalo de nuevo."
3. Start backend server
4. Try to update inventory with invalid product ID
   - Expected: Error message displays in admin panel

#### 6.3 Authentication Errors
1. Clear `admin_token` from localStorage
2. Try to access `/admin/leads`
   - Expected: Redirect to login page
3. Enter invalid credentials
   - Expected: Error message displays
4. Use expired token
   - Expected: Redirect to login or error message

### Expected Results
- ✅ All validation errors are caught and displayed
- ✅ API errors show user-friendly messages
- ✅ Authentication errors redirect appropriately
- ✅ No unhandled errors crash the application

---

## 7. Edge Cases - Form Validations

### Test Steps

#### 7.1 Step-by-Step Validation
1. Navigate to `/quote`
2. **Step 1 Validation:**
   - Leave name empty → Verify "Siguiente" is disabled
   - Fill name, leave email empty → Verify "Siguiente" is disabled
   - Fill name and email, leave phone empty → Verify "Siguiente" is disabled
   - Fill all required fields → Verify "Siguiente" is enabled
3. **Step 4 Validation:**
   - Don't select budget → Verify "Siguiente" is disabled
   - Select budget → Verify "Siguiente" is enabled
4. **Step 5 Validation:**
   - Don't select purchase date → Verify "Siguiente" is disabled
   - Select purchase date → Verify "Siguiente" is enabled

#### 7.2 Email Format Validation
1. Enter invalid email formats:
   - "plainaddress" → Should show validation error
   - "@domain.com" → Should show validation error
   - "user@domain" → Should show validation error
2. Enter valid email: "user@domain.com" → Should accept

#### 7.3 Navigation Between Steps
1. Fill Step 1 and proceed to Step 2
2. Click "← Anterior" → Should return to Step 1 with data preserved
3. Proceed through all steps
4. Verify data persists when navigating back and forth

#### 7.4 Form Persistence
1. Fill out form partially
2. Navigate away from page
3. Return to quote page
4. Verify form is reset (expected behavior - no persistence implemented)

### Expected Results
- ✅ All required field validations work correctly
- ✅ Email format validation works
- ✅ Navigation preserves form data within session
- ✅ Form resets appropriately

---

## Test Data Setup

### Sample Lead Data
```json
{
  "name": "Test User",
  "email": "test@example.com",
  "phone": "+1 (555) 123-4567",
  "company": "Test Company",
  "industry": "Textil y Confección",
  "productionVolume": "1000 piezas por día",
  "budget": "$25,000 - $50,000",
  "purchaseDate": "1-3 meses",
  "message": "Test message for quote request"
}
```

### Database Reset (if needed)
```bash
# Backend directory
npm run prisma:migrate reset
npm run seed
```

---

## Browser Compatibility Testing

Test the following in:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

---

## Performance Testing

1. Submit multiple leads rapidly
2. Verify all leads appear correctly
3. Test with large number of leads (100+)
4. Verify pagination works (if implemented)
5. Check page load times

---

## Notes

- All tests should be performed in a development environment
- Use test data that won't affect production
- Document any bugs or issues found during testing
- Verify fixes after bug resolution

