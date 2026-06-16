import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  User,
} from "firebase/auth";
import { auth } from "./config";

/**
 * Logs in a user using email and password.
 */
export async function loginWithEmail({ email, password }: import("../validators/auth.schema").LoginInput) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

/**
 * Registers a new user and updates their display name.
 */
export async function registerWithEmail({
  email,
  password,
  name,
}: Omit<import("../validators/auth.schema").RegisterInput, "confirmPassword">) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  
  // Update the user profile with the display name
  if (userCredential.user) {
    await updateProfile(userCredential.user, {
      displayName: name,
    });
  }
  
  return userCredential.user;
}

/**
 * Sends a password reset email to the given address.
 */
export async function resetPassword({ email }: import("../validators/auth.schema").ForgotPasswordInput) {
  await sendPasswordResetEmail(auth, email);
}

/**
 * Signs out the current user.
 */
export async function logoutUser() {
  await signOut(auth);
}
