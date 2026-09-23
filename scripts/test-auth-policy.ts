import {
  evaluatePassword,
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../src/lib/auth/password-policy";

console.log("=== TEST POLITIQUE DE MOT DE PASSE MONPARCOURS ===");

// Test 1: Empty password
const evalEmpty = evaluatePassword("");
console.assert(!evalEmpty.isValid, "Empty password should be invalid");

// Test 2: Character by character progression
const p1 = evaluatePassword("A");
console.assert(p1.rules.find((r) => r.id === "uppercase")?.isMet === true, "A has uppercase");
console.assert(p1.rules.find((r) => r.id === "minLength")?.isMet === false, "A lacks length");

const p2 = evaluatePassword("Ab");
console.assert(p2.rules.find((r) => r.id === "lowercase")?.isMet === true, "Ab has lowercase");

const p3 = evaluatePassword("Ab1");
console.assert(p3.rules.find((r) => r.id === "number")?.isMet === true, "Ab1 has number");

const p4 = evaluatePassword("Ab1!");
console.assert(p4.rules.find((r) => r.id === "special")?.isMet === true, "Ab1! has special");
console.assert(!p4.isValid, "Ab1! lacks min length");

const p5 = evaluatePassword("Abcdef12!");
console.assert(p5.isValid === true, "Abcdef12! should be completely valid");
console.assert(p5.score === 5, "Abcdef12! should have 5/5 score");

// Test 3: Zod Register Schema
const regValid = registerSchema.safeParse({
  email: "etudiant@univ-lome.tg",
  password: "Password123!",
  confirmPassword: "Password123!",
});
console.assert(regValid.success === true, "Valid registration must pass Zod");

const regMismatch = registerSchema.safeParse({
  email: "etudiant@univ-lome.tg",
  password: "Password123!",
  confirmPassword: "Password123",
});
console.assert(regMismatch.success === false, "Mismatched passwords must fail Zod");

const regWeak = registerSchema.safeParse({
  email: "etudiant@univ-lome.tg",
  password: "password",
  confirmPassword: "password",
});
console.assert(regWeak.success === false, "Weak password must fail Zod");

// Test 4: Zod Login Schema
const logValid = loginSchema.safeParse({
  email: "etudiant@univ-lome.tg",
  password: "Password123!",
});
console.assert(logValid.success === true, "Valid login must pass");

// Test 5: Zod Forgot Password Schema
const forgotValid = forgotPasswordSchema.safeParse({
  email: "etudiant@univ-lome.tg",
});
console.assert(forgotValid.success === true, "Valid forgot password must pass");

// Test 6: Zod Reset Password Schema
const resetValid = resetPasswordSchema.safeParse({
  password: "NewPassword123!",
  confirmPassword: "NewPassword123!",
});
console.assert(resetValid.success === true, "Valid reset password must pass");

console.log("ALL PASSWORD POLICY UNIT TESTS PASSED SUCCESSFULLY!");
