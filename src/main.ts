import { createApp } from "vue";
import App from "./App.vue";
// import "./registerServiceWorker";
import router from "./router";
import PrimeVue from "primevue/config";
import Button from "primevue/button";
import Toolbar from "primevue/toolbar";
import Avatar from "primevue/avatar";
import Card from "primevue/card";
import InputSwitch from "primevue/inputswitch";
import InputText from "primevue/inputtext";
import RadioButton from "primevue/radiobutton";
import Textarea from "primevue/textarea";
import Listbox from 'primevue/listbox';
import Dialog from "primevue/dialog";
import SpeedDial from "primevue/speeddial";
import Toast from "primevue/toast";
import ProgressBar from 'primevue/progressbar';
// import Sidebar from "primevue/sidebar";

import Tooltip from "primevue/tooltip";
import ToastService from "primevue/toastservice";

import "primeflex/primeflex.css"; // layouts
import "primevue/resources/themes/vela-green/theme.css"; // theme
import "primevue/resources/primevue.min.css"; // core css
import "primeicons/primeicons.css"; // icons

const app = createApp(App);
app.use(router);
app.use(PrimeVue, { ripple: true });
app.use(ToastService);

app.component("Button", Button);
app.component("Toolbar", Toolbar);
app.component("Avatar", Avatar);
app.component("Card", Card);
app.component("InputSwitch", InputSwitch);
app.component("InputText", InputText);
app.component("RadioButton", RadioButton);
app.component("Textarea", Textarea);
app.component("Listbox", Listbox);
app.component("Dialog", Dialog);
app.component("SpeedDial", SpeedDial);
app.component("Toast", Toast);
app.component("ProgressBar", ProgressBar);
// app.component("Sidebar", Sidebar);

app.directive("tooltip", Tooltip);

app.mount("#app");
