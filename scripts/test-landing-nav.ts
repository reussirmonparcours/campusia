async function runTests() {
  console.log("=== VÉRIFICATION DU PARCOURS DE NAVIGATION ET TARIFS ===");

  const resLanding = await fetch("http://localhost:3000/");
  if (!resLanding.ok) throw new Error("Landing not responding 200");
  const htmlLanding = await resLanding.text();

  // 1. Tarifs prices verification
  console.assert(htmlLanding.includes("tarifs"), "Landing must contain #tarifs anchor");
  console.assert(htmlLanding.includes("D&eacute;couverte") || htmlLanding.includes("Découverte"), "Contains Découverte");
  console.assert(htmlLanding.includes("Essentiel"), "Contains Essentiel");
  console.assert(htmlLanding.includes("Complet"), "Contains Complet");
  console.assert(htmlLanding.includes("2 500") || htmlLanding.includes("2 500") || htmlLanding.includes("2500"), "Contains 2 500 FCFA");
  console.assert(htmlLanding.includes("3 900") || htmlLanding.includes("3 900") || htmlLanding.includes("3900"), "Contains 3 900 FCFA");
  console.assert(!htmlLanding.includes("1 500") && !htmlLanding.includes("1 500"), "Does NOT contain old price 1 500");
  console.assert(!htmlLanding.includes("3 500") && !htmlLanding.includes("3 500"), "Does NOT contain old price 3 500");

  // 2. CTAs in Landing
  console.assert(htmlLanding.includes("/auth/register?plan=essential"), "Contains link /auth/register?plan=essential");
  console.assert(htmlLanding.includes("/auth/register?plan=complete"), "Contains link /auth/register?plan=complete");
  console.assert(htmlLanding.includes("/auth/register"), "Contains link /auth/register");
  console.assert(htmlLanding.includes("/auth/login"), "Contains link /auth/login");

  // 3. Register page
  const resRegister = await fetch("http://localhost:3000/auth/register");
  if (!resRegister.ok) throw new Error("Register not responding 200");
  const htmlRegister = await resRegister.text();
  console.assert(htmlRegister.includes("/auth/login"), "Register page links to /auth/login");

  // 4. Register with plans
  const resPlanEss = await fetch("http://localhost:3000/auth/register?plan=essential");
  console.assert(resPlanEss.ok, "Register with plan=essential responds 200");

  const resPlanComp = await fetch("http://localhost:3000/auth/register?plan=complete");
  console.assert(resPlanComp.ok, "Register with plan=complete responds 200");

  // 5. Login page
  const resLogin = await fetch("http://localhost:3000/auth/login");
  if (!resLogin.ok) throw new Error("Login not responding 200");
  const htmlLogin = await resLogin.text();
  console.assert(htmlLogin.includes("/auth/register"), "Login links to /auth/register");
  console.assert(htmlLogin.includes("/auth/forgot-password"), "Login links to /auth/forgot-password");

  // 6. Forgot password page
  const resForgot = await fetch("http://localhost:3000/auth/forgot-password");
  if (!resForgot.ok) throw new Error("Forgot password not responding 200");
  const htmlForgot = await resForgot.text();
  console.assert(htmlForgot.includes("/auth/login"), "Forgot password links back to /auth/login");

  console.log("TOUTES LES VÉRIFICATIONS DE NAVIGATION ET TARIFS SONT VALIDÉES !");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
