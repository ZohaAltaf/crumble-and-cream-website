// ============================================
// AUTH.JS — Firebase Authentication
// ============================================

// 1. Jo files Root Folder mein hain, unke liye '../' use karein
import { auth, db } from '../firebase-config.js';
import { showToast } from '../toast.js';

// 2. Firebase SDKs CDN se direct import hote hain (yeh bilkul theek hain)
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

// 3. Jo files khud bhi 'js/' folder ke andar hain, unke liye './' theek hai
import { isFirebaseConfigured } from './products.js';
import {
  getDemoUsers,
  saveDemoUsers,
  getDemoUserByUid,
  ensureDemoBakerSeed,
  getCurrentDemoUid,
  setCurrentDemoUid
} from './demo-store.js';

// --------------------------------------------
// SIGNUP (Customer only — baker accounts are never
// self-service; see note in signup.html)
// --------------------------------------------
export async function signup({ name, email, phone, password }) {
  if (!isFirebaseConfigured()) {
    ensureDemoBakerSeed();
    const users = getDemoUsers();
    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      showToast('This email is already registered.', 'error');
      return;
    }
    const uid = 'demo-user-' + Date.now();
    users.push({ uid, name, email, phone, password, role: 'customer', createdAt: Date.now() });
    saveDemoUsers(users);
    setCurrentDemoUid(uid);
    showToast('Account created! Welcome to Crumble & Cream. (Demo mode — Firebase not connected yet)');
    window.location.href = 'customer-dashboard.html';
    return;
  }

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);

    await setDoc(doc(db, 'users', cred.user.uid), {
      uid: cred.user.uid,
      name,
      email,
      phone,
      role: 'customer', // IMPORTANT: role is always set server-side logic /
      createdAt: serverTimestamp() // manually in Firestore — never trust a client-sent role
    });

    showToast('Account created! Welcome to Crumble & Cream.');
    window.location.href = 'customer-dashboard.html';
  } catch (err) {
    showToast(mapAuthError(err), 'error');
  }
}

// --------------------------------------------
// LOGIN
// --------------------------------------------
export async function login(email, password) {
  if (!isFirebaseConfigured()) {
    ensureDemoBakerSeed();
    const user = getDemoUsers().find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    if (!user) {
      showToast('Incorrect email or password.', 'error');
      return;
    }
    setCurrentDemoUid(user.uid);
    showToast('Login successful! (Demo mode — Firebase not connected yet)');
    window.location.href = user.role === 'baker' ? 'baker-dashboard.html' : 'customer-dashboard.html';
    return;
  }

  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    await redirectByRole(cred.user.uid);
  } catch (err) {
    showToast(mapAuthError(err), 'error');
  }
}

// --------------------------------------------
// GOOGLE LOGIN
// --------------------------------------------
export async function loginWithGoogle() {
  if (!isFirebaseConfigured()) {
    showToast('Google sign-in needs a real Firebase project. Please use email login/signup for now (Demo mode).', 'error');
    return;
  }

  try {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);

    const userDoc = await getDoc(doc(db, 'users', cred.user.uid));
    if (!userDoc.exists()) {
      // First-time Google sign-in — create a customer profile
      await setDoc(doc(db, 'users', cred.user.uid), {
        uid: cred.user.uid,
        name: cred.user.displayName || '',
        email: cred.user.email,
        phone: '',
        role: 'customer',
        createdAt: serverTimestamp()
      });
    }

    await redirectByRole(cred.user.uid);
  } catch (err) {
    showToast(mapAuthError(err), 'error');
  }
}

// --------------------------------------------
// FORGOT PASSWORD
// --------------------------------------------
export async function forgotPassword(email) {
  if (!isFirebaseConfigured()) {
    showToast('Demo mode: no real email is sent. Set up Firebase to enable password reset.', 'error');
    return;
  }

  try {
    await sendPasswordResetEmail(auth, email);
    showToast('Password reset link sent to your email.');
  } catch (err) {
    showToast(mapAuthError(err), 'error');
  }
}

// --------------------------------------------
// LOGOUT
// --------------------------------------------
export async function logout() {
  if (!isFirebaseConfigured()) {
    setCurrentDemoUid(null);
    window.location.href = 'login.html';
    return;
  }
  await signOut(auth);
  window.location.href = 'login.html';
}

// --------------------------------------------
// ROLE-BASED REDIRECT
// --------------------------------------------
async function redirectByRole(uid) {
  const userDoc = await getDoc(doc(db, 'users', uid));
  const role = userDoc.exists() ? userDoc.data().role : 'customer';
  showToast('Login successful!');
  window.location.href = role === 'baker' ? 'baker-dashboard.html' : 'customer-dashboard.html';
}

// --------------------------------------------
// PROTECT A PAGE — call at the top of dashboard pages
// requiredRole: 'customer' | 'baker' | null (any logged-in user)
// --------------------------------------------
export function protectPage(requiredRole = null) {
  if (!isFirebaseConfigured()) {
    return new Promise((resolve) => {
      const user = getDemoUserByUid(getCurrentDemoUid());
      if (!user) {
        showToast('Please login first.', 'error');
        window.location.href = 'login.html';
        return;
      }
      if (requiredRole && user.role !== requiredRole) {
        showToast('You do not have access to this page.', 'error');
        window.location.href = requiredRole === 'baker' ? 'customer-dashboard.html' : 'login.html';
        return;
      }
      resolve({ user: { uid: user.uid, email: user.email }, role: user.role, profile: user });
    });
  }

  return new Promise((resolve) => {
    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        showToast('Please login first.', 'error');
        window.location.href = 'login.html';
        return;
      }

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const role = userDoc.exists() ? userDoc.data().role : 'customer';

      if (requiredRole && role !== requiredRole) {
        showToast('You do not have access to this page.', 'error');
        window.location.href = requiredRole === 'baker' ? 'customer-dashboard.html' : 'login.html';
        return;
      }

      resolve({ user, role, profile: userDoc.data() });
    });
  });
}

// --------------------------------------------
// UPDATE HEADER (login/signup vs profile icon) — call on every page
// --------------------------------------------
export function watchAuthForHeader() {
  if (!isFirebaseConfigured()) {
    const isLoggedIn = !!getCurrentDemoUid();
    document.querySelectorAll('.auth-logged-out').forEach((el) => (el.style.display = isLoggedIn ? 'none' : ''));
    document.querySelectorAll('.auth-logged-in').forEach((el) => (el.style.display = isLoggedIn ? '' : 'none'));
    return;
  }

  onAuthStateChanged(auth, (user) => {
    const loggedOutEls = document.querySelectorAll('.auth-logged-out');
    const loggedInEls = document.querySelectorAll('.auth-logged-in');

    loggedOutEls.forEach((el) => (el.style.display = user ? 'none' : ''));
    loggedInEls.forEach((el) => (el.style.display = user ? '' : 'none'));
  });
}

function mapAuthError(err) {
  const code = err.code || '';
  if (code.includes('email-already-in-use')) return 'This email is already registered.';
  if (code.includes('invalid-credential') || code.includes('wrong-password')) return 'Incorrect email or password.';
  if (code.includes('user-not-found')) return 'No account found with this email.';
  if (code.includes('weak-password')) return 'Password should be at least 6 characters.';
  if (code.includes('popup-closed')) return 'Google sign-in was cancelled.';
  return 'Something went wrong. Please try again.';
}
