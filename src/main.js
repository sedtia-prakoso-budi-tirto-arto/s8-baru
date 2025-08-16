import Button from "primevue/button";
import PrimeVue from "primevue/config";
import InputText from "primevue/inputtext";
import Toast from "primevue/toast"; // Import Toast component
import ToastService from "primevue/toastservice"; // Import ToastService
import Select from "primevue/select"; // Import Select component
import Galleria from "primevue/galleria";
import { createApp } from "vue";
import App from "./App.vue";
import "primeicons/primeicons.css"; // Import PrimeIcons CSS
import "./assets/tailwind.css";
import "./style.css";
import router from "./router";
import Card from "primevue/card";
import Textarea from "primevue/textarea";
import Menubar from "primevue/menubar";
import BlockUI from "primevue/blockui";
import Tag from "primevue/tag";
import InputNumber from "primevue/inputnumber";
import Dialog from "primevue/dialog";
import ConfirmDialog from "primevue/confirmdialog";
import ConfirmPopup from "primevue/confirmpopup";
import ConfirmationService from "primevue/confirmationservice";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import SelectButton from "primevue/selectbutton";
import InputIcon from "primevue/inputicon"; // If it's a PrimeVue component
import IconField from "primevue/iconfield"; // If this is a PrimeVue component
import AutoComplete from "primevue/autocomplete";
import InputOtp from "primevue/inputotp";
import Image from "primevue/image";
import ToggleButton from "primevue/togglebutton";
import Skeleton from "primevue/skeleton";
import { createPinia } from "pinia";
import Rating from "primevue/rating";
import ToggleSwitch from "primevue/toggleswitch";
import Slider from "primevue/slider";
import Carousel from "primevue/carousel";
import Checkbox from "primevue/checkbox";
import Vue3Lottie from "vue3-lottie";
import FileUpload from "primevue/fileupload";
import Stepper from "primevue/stepper";
import StepList from "primevue/steplist";
import StepPanels from "primevue/steppanels";
import StepItem from "primevue/stepitem";
import Step from "primevue/step";
import StepPanel from "primevue/steppanel";
import ProgressBar from "primevue/progressbar";
import Message from "primevue/message";
import DatePicker from "primevue/datepicker";
import Password from 'primevue/password';


const app = createApp(App);
const pinia = createPinia();

// Register components
app.component("InputText", InputText);
app.component("Button", Button);
app.component("Toast", Toast); // Register Toast component
app.component("Select", Select); // Register globally
app.component("Galleria", Galleria); // Register Galleria component
app.component("Card", Card); // Register Card component
app.component("Textarea", Textarea); // Register Textarea component
app.component("Menubar", Menubar); // Register Menubar component
app.component("BlockUI", BlockUI); // Register BlockUI component
app.component("Tag", Tag); // Register Tag component
app.component("InputNumber", InputNumber); // Register InputNumber component
app.component("Dialog", Dialog); // Register Dialog component
app.component("ConfirmDialog", ConfirmDialog); // Register ConfirmDialog component
app.component("ConfirmPopup", ConfirmPopup); // Register ConfirmPopup component
app.component("DataTable", DataTable); // Register DataTable component
app.component("Column", Column); // Register Column component
app.component("SelectButton", SelectButton); // Register SelectButton component
app.component("InputIcon", InputIcon); // Register InputIcon component
app.component("IconField", IconField); // Register IconField component
app.component("AutoComplete", AutoComplete); // Register AutoComplete component
app.component("InputOtp", InputOtp); // Register InputOtp component
app.component("Image", Image); // Register Image component
app.component("ToggleButton", ToggleButton); // Register ToggleButton component
app.component("Skeleton", Skeleton); // Register Skeleton component
app.component("Rating", Rating); // Register Rating component
app.component("ToggleSwitch", ToggleSwitch); // Register ToggleSwitch component
app.component("Slider", Slider); // Register Slider component
app.component("Carousel", Carousel); // Register Carousel component
app.component("Checkbox", Checkbox); // Register Checkbox component
app.component("FileUpload", FileUpload); // Register FileUpload component
app.component("Stepper", Stepper); // Register Stepper component
app.component("StepList", StepList); // Register StepList component
app.component("StepPanels", StepPanels); // Register StepPanels component
app.component("StepItem", StepItem); // Register StepItem component
app.component("Step", Step); // Register Step component
app.component("StepPanel", StepPanel); // Register StepPanel component
app.component("ProgressBar", ProgressBar); // Register ProgressBar component
app.component("Message", Message); // Register Message component
app.component("DatePicker", DatePicker); // Register DatePicker component
app.component("Password", Password);

// Use PrimeVue and ToastService
app.use(PrimeVue, { theme: "none" });
app.use(ToastService); // Enable ToastService
app.use(ConfirmationService); // Enable ConfirmationService
app.use(router);
app.use(pinia);
app.use(Vue3Lottie, { name: "LottieAnimation" });
app.mount("#app");
