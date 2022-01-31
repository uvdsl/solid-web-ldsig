import { ref } from "vue";

let isRefreshing = false;
const hasUpdatedAvailable = ref(false);
let registration: ServiceWorkerRegistration;

// Prevent multiple refreshes
navigator.serviceWorker.addEventListener("controllerchange", () => {
  if (isRefreshing) return;
  isRefreshing = true;
  // Here the actual reload of the page occurs
  window.location.reload();
});

// Store the SW registration so we can send it a message
// We use `updateExists` to control whatever alert, toast, dialog, etc we want to use
// To alert the user there is an update they need to refresh for
const updateAvailable = (event: Event) => {
  registration = (event as CustomEvent).detail;
  hasUpdatedAvailable.value = true;
};

  // Called when the user accepts the update
const refreshApp = () => {
    hasUpdatedAvailable.value = false
    // Make sure we only send a 'skip waiting' message if the SW is waiting
    if (!registration || !registration.waiting) return
    // send message to SW to skip the waiting and activate the new SW
    registration.waiting.postMessage({ type: 'SKIP_WAITING' })
  }

// Listen for our custom event from the SW registration
document.addEventListener("serviceWorkerUpdated", updateAvailable, { once: true });

export const useServiceWorkerUpdate = () => {
    return {
        hasUpdatedAvailable,
        refreshApp
    };
  };