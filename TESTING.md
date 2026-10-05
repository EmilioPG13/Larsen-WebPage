# Testing

Automated tests cover components, services and the API. This guide covers what they can't: a manual pass through the real flows before a release.

## Automated

```bash
npm test                      # frontend: Vitest + Testing Library
npm run test:coverage

cd backend
npm test                      # API: Jest + Supertest (Prisma is mocked)
npm run test:coverage
```

## Manual setup

- Database migrated and seeded (`npm run prisma:migrate` and `npm run seed` in `backend/`).
- API running on `http://localhost:3001`, site on `http://localhost:3000`.
- Use a **local or test database**, never production. Quotes create real leads, and with `SMTP_*` set they send real emails.
- Leave `SMTP_*` empty to test without sending email: leads are still saved and the notification is skipped with a warning in the API log.
- Sign in at `/admin/login` with the `ADMIN_EMAIL` and `ADMIN_PASSWORD` used for the seed. To test the `INVENTARIO` role, create a user for it from `/admin/usuarios`.

## 1. Quote request (public)

1. Open `/cotizacion`. Fill name, email and phone (required), then optionally company, machine type, volume, machine and message. Send.
2. **Expect:** a thank-you message, `POST /api/leads` returning `201` in the Network tab, and no console errors.
3. Leave a required field empty, or enter an invalid email. **Expect:** inline errors and no request sent.
4. Stop the API and submit. **Expect:** a user-facing error message (or the EmailJS fallback if it is configured), never a silent failure.
5. With SMTP configured, **expect** two emails: the team notification (Reply, Call, "View in panel" buttons) and a customer confirmation. Submitting again from the same address within an hour must not send a second confirmation.

## 2. Language and catalog (public)

1. Switch ES/EN with the header toggle. **Expect:** all copy, the `<html lang>` attribute and the page title change, and the choice survives a reload.
2. Open `/maquinas` and a detail page such as `/maquinas/aries-6`. **Expect:** availability badges that match the data, and translated spec labels and values.
3. On a detail page, download the spec sheet. **Expect:** a one-page A4 PDF in the selected language, and a new lead with source `spec-download` in the admin panel.
4. Check `/`, `/marcas`, `/nosotros` and an unknown URL (404 page) at phone width. **Expect:** no horizontal scroll.

## 3. Admin access and roles

1. With no token, open `/admin/leads`. **Expect:** redirect to `/admin/login`.
2. Sign in with wrong credentials. **Expect:** an error message. After 5 failures from one IP in 15 minutes, **expect** a `429` with a retry time, even with the right password.
3. Signed in as `ADMIN`, every sidebar section opens.
4. Signed in as `INVENTARIO`, only `/admin/inventario` opens. Any other admin URL redirects there, and the API answers `403` to leads and users requests.
5. Clear `admin_token` from localStorage and reload. **Expect:** back to the login page.
6. Change your password from the sidebar and sign in again with the new one.

## 4. Leads (`ADMIN`)

1. The lead from section 1 appears with status **Nuevo**, and the sidebar badge counts new leads.
2. Open **Ver detalles**. **Expect:** all the submitted fields.
3. Filter by each status, then change a lead's status. **Expect:** the table updates and the change survives a refresh.

## 5. Inventory (`ADMIN` and `INVENTARIO`)

1. Create a unit with brand, model, gauge and serial number. Creating the same brand and serial again must be rejected.
2. Change its status between Disponible, Apartada and Vendida. **Expect:** the tab counts update, and a sold unit shows its sale date.
3. Open **Historial**. **Expect:** one entry per change, with the user and time.
4. Export to Excel and PDF. **Expect:** files that match the filtered list.
5. As `INVENTARIO`, delete must not be offered; as `ADMIN`, deleting a unit asks for confirmation.
6. Internal notes never appear in the public `/api/catalog` response.

## 6. Catalog management (`ADMIN`)

1. Create, edit and delete a product, a machine and a brand. **Expect:** changes show on the public site after a refresh.
2. Toggle stock on a product and on a machine. **Expect:** the public badge follows.

## 7. Empty states and errors

1. Point the panel at an empty database (or filter to no results). **Expect:** friendly empty-state messages and no console errors on leads, inventory, products and machines.
2. Stop the API while signed in. **Expect:** an error message in the panel, not a blank page.

## 8. Before a release

- Chrome, Firefox, Safari and Edge: sections 1 and 2.
- `npm run lint` and `npm run build` pass in the root, and `npm run build` passes in `backend/`.
- No secrets in the diff; `.env` files are untracked.
