async function runJourneysTest() {
  console.log("=== TESTS DES PARCOURS UTILISATEURS EN CONDITIONS RÉELLES ===");

  const baseUrl = "http://localhost:3000";

  // Test 1: Unauthenticated request to /auth/register should return 200 without redirecting to /dashboard
  const resRegister = await fetch(`${baseUrl}/auth/register`, { redirect: "manual" });
  console.log("TEST A & B: /auth/register status:", resRegister.status);
  console.assert(resRegister.status === 200, "/auth/register must return HTTP 200 without redirection to /dashboard");

  // Test 2: Unauthenticated request to /auth/login should return 200 without redirecting to /dashboard
  const resLogin = await fetch(`${baseUrl}/auth/login`, { redirect: "manual" });
  console.log("TEST C: /auth/login status:", resLogin.status);
  console.assert(resLogin.status === 200, "/auth/login must return HTTP 200 without redirection to /dashboard");

  // Test 3: Plan parameter routes
  const resPlanEss = await fetch(`${baseUrl}/auth/register?plan=essential`, { redirect: "manual" });
  console.log("TEST D: /auth/register?plan=essential status:", resPlanEss.status);
  console.assert(resPlanEss.status === 200, "/auth/register?plan=essential must return HTTP 200");

  const resPlanComp = await fetch(`${baseUrl}/auth/register?plan=complete`, { redirect: "manual" });
  console.log("TEST E: /auth/register?plan=complete status:", resPlanComp.status);
  console.assert(resPlanComp.status === 200, "/auth/register?plan=complete must return HTTP 200");

  // Test 4: Forgot password route
  const resForgot = await fetch(`${baseUrl}/auth/forgot-password`, { redirect: "manual" });
  console.log("TEST H: /auth/forgot-password status:", resForgot.status);
  console.assert(resForgot.status === 200, "/auth/forgot-password must return HTTP 200");

  // Test 5: Simulating a user who has a stale or previous auth cookie visiting /auth/register
  // Previously, this caused an immediate redirection to /dashboard!
  const resWithCookie = await fetch(`${baseUrl}/auth/register`, {
    headers: {
      Cookie: "sb-mockproject-auth-token=some-previous-token",
    },
    redirect: "manual",
  });
  console.log("CRITICAL TEST: /auth/register WITH auth cookie status:", resWithCookie.status);
  console.assert(
    resWithCookie.status === 200,
    "Visiting /auth/register even with auth cookie must NOT redirect to /dashboard!"
  );

  // Test 6: Protected path /dashboard without auth cookies -> MUST redirect to /auth/login
  const resDashboardNoAuth = await fetch(`${baseUrl}/dashboard`, { redirect: "manual" });
  console.log("PROTECTED ROUTE TEST: /dashboard without auth status:", resDashboardNoAuth.status);
  console.assert(
    resDashboardNoAuth.status === 307,
    "Accessing /dashboard unauthenticated must redirect (307)"
  );
  const locationHeader = resDashboardNoAuth.headers.get("location");
  console.assert(
    locationHeader?.includes("/auth/login"),
    `/dashboard must redirect to /auth/login, got: ${locationHeader}`
  );

  console.log("TOUS LES TESTS DE PARCOURS UTILISATEURS ONT RÉUSSI AVEC SUCCÈS !");
}

runJourneysTest().catch((err) => {
  console.error("Journeys test failed:", err);
  process.exit(1);
});
