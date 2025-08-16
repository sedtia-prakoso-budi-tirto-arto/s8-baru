import { createRouter, createWebHistory } from "vue-router";

import Home from "./components/Home.vue";
import Fotographer from "./components/Fotographer.vue";
import Katalog from "./components/Katalog.vue";
import Loc from "./components/Loc.vue";
import TesCam from "./components/TesCam.vue";
import Customer from "./components/Customer.vue";
import Edit from "./components/Edit.vue";
import Product from "./components/Product.vue";
import Frame from "./components/Frame.vue";
import FrameHp from "./components/FrameHp.vue";
import Print from "./components/Print.vue";
import Tes from "./components/Tes.vue";
import Login from "./components/Login.vue";
import background from "./components/Background.vue";
import EditCust from "./components/EditCust.vue";

const routes = [
  { path: "/", name: "Home", component: Home },
  { path: "/list", name: "Fotographer", component: Fotographer },
  { path: "/katalog", name: "Katalog", component: Katalog },
  { path: "/loc", name: "Loc", component: Loc },
  { path: "/tescam", name: "TesCam", component: TesCam },
  { path: "/customer", name: "Customer", component: Customer },
  {
    path: "/edit",
    name: "Edit",
    component: Edit,
  },
  {
    path: "/product",
    name: "Product",
    component: Product,
  },
  {
    path: "/frame",
    name: "Frame",
    component: Frame,
  },
  {
    path: "/framehp",
    name: "FrameHp",
    component: FrameHp,
  },
  {
    path: "/print",
    name: "Print",
    component: Print,
  },
  {
    path: "/tes",
    name: "Tes",
    component: Tes,
  },
  { path: "/login", name: "Login", component: Login },
  {
    path: "/background",
    name: "Background",
    component: background,
  },
  {
    path: "/edit-cust",
    name: "Edit Cust",
    component: EditCust,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Navigation guard for authentication and page access rules
router.beforeEach((to, from, next) => {
  // Check if the route requires authentication
  const requiresAuth = ["Home", "Fotographer", "Katalog"].includes(to.name);

  // Check login status from localStorage
  const isLoggedIn = localStorage.getItem("isLoggedIn");

  if (requiresAuth && !isLoggedIn) {
    // Redirect to login page if not logged in
    next({ name: "Login" });
  } else if (to.name === "Edit") {
    // Ensure "Edit" page can only be accessed after "Customer" page
    const visitedCustomer = localStorage.getItem("visitedCustomer");

    if (!visitedCustomer) {
      next({ name: "Customer" });
    } else {
      next();
    }
  } else {
    // Allow navigation for all other routes
    next();
  }
});

export default router;
