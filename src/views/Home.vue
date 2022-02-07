<template>
  <Lector
    v-if="!selected"
    @openScribe="select"
    @saveURI="saveLectorURI"
    :inititalURI="lectorURI"
    @fetchFinished="contDemo"
  />
  <Scribe v-if="selected" @back="unselect" :inititalURI="scribeURI" @fetchFinished="contDemo" :demoContent="demoContent"/>

  <Toast
    position="bottom-right"
    :breakpoints="{ '420px': { width: '100%', right: '0', left: '0' } }"
  />

  <!-- Demo Dialog -->

  <Dialog header="Welcome to the Live Demo!" v-model:visible="openedDemo"  position="bottom">
    <div class="flex flex-wrap align-items-center" >
      <div style="margin:15px 0px 15px 0px;">Check out our:</div>
      <div class="flex justify-content-between">
      <Button label="Website" class="p-button-rounded" style="margin-left:10px" @click="refWebsite" />
      <Button label="Code" class="p-button-rounded" style="margin-left:10px" @click="refCode" />
      <Button label="Paper" class="p-button-rounded" style="margin-left:10px" @click="refPaper" />
    </div>
    </div>
    <div>
    <p>
      In this demo, we showcase Linked Data Signatures, Signed URIs and the
      resulting document graph.
    </p>
    <p>
      The app has two views: 
      <ul>
        <li> With the {{!selected ? 'current' : 'other'}} one, where you can visualise a graph of documents that are available at a Signed URI. </li>
        <li> With the {{selected ? 'current' : 'other'}}  one, GET resources from the Web, edit them, sign them, and PUT them at a Signed URI. </li>
      </ul>
      You can activate the demo mode by clicking the "Demo Me"-Button.
      <br/>
      To disable demo mode, click the "Got it"-Button.
      <br /> 
      To bring the current demo dialog back, click the "Help!"-Button which will appear in the bottom right corner of your screen.
    </p>
    <p>
    {{ isLoggedIn ?
    `
      Since you are logged in: To skip to part 2 of the demo, click the "Skip to Part 2"-Button.
    ` :''
    }}
    </p>
    </div>
    <template #footer>
       <div class="flex justify-content-between">
       <Button
        label="Got it!"
        class="p-button-outlined"
        @click="openedDemo = false"
      />
        <Button
        v-if="isLoggedIn"
        label="Skip to Part 2!"
        class="p-button-outlined p-button-warning"
        autofocus
        @click="openedDemo = false; skipToSix()"
      />
      <Button
        label="Demo me!"
        class="p-button-outlined"
        autofocus
        @click="showDemo"
      />
      </div>
    </template>
  </Dialog>

<Dialog header="Now you see a colorful graph!" v-model:visible="openedDemo2" position="bottom">
  <p>
    Each node represents a document that is available at a Signed URI.<br />
    Each edge represents a link to another document via a Signed URI.
  </p>
   <p>
    A green colored node indicates that the all verification steps were successful.<br />
    A red colored node indicates that some verification step was unsuccessful.
  </p>
  <p>
    Click on the red colored node to inspect the resource in detail! <br />
    You will be taken to the other view of this app, but we will be there to help you.
  </p>
<template #footer>
   <div class="flex justify-content-between">
      <Button
        label="End Demo!"
        class="p-button-outlined"
        @click="openedDemo2 = false; isInDemoMode = 0; lectorURI='';demoContent='';"
      />
      <Button
        label="Continue!"
        class="p-button-outlined"
        autofocus
        @click="openedDemo2 = false; demoSelect('err');"
      />
      </div>
    </template>
  </Dialog>

<Dialog header="Hello there!" v-model:visible="openedDemo3" position="bottom">
  <p>
    Oh my! All three checks were unsuccessful:
    <ol>
      <li> Checking if all statments that are quoted, i.e. covered, by the signature are asserted. 
      <p>
          Looking closely, we commented out the second object &lt;#cool&gt; which a quoted triple <br />
          exists for in the sec:proofOf object list of the _:signature.
          </p>
          </li>
      <li> Checking if the signature for these quoted triples is valid.
      <p>
            Looking closely, we changed the last element of the signature.
            </p>
      </li>
      <li> Checking if the signature matches the suffix of the Signed URI.  
      <p>
            Looking closely, the aforementioned change makes the signatures not match anymore. <br /> 
            The Signed URI has still the original signature.
            </p>
      </li>
    </ol>

  </p>
  <p>
    If you want to check the error messages again, simply GET the resource again.
  </p>
   <p>
    Let's now check out the public key that this message was signed with!
  </p>
<template #footer>
   <div class="flex justify-content-between">
      <Button
        label="End Demo!"
        class="p-button-outlined"
        @click="openedDemo3 = false; isInDemoMode = 0; lectorURI='';demoContent='';"
      />
       <Button
        label="Continue!"
        class="p-button-outlined"
        autofocus
        @click="openedDemo3 = false; demoSelect('key');" 
      />
      </div>
    </template>
  </Dialog>

  <Dialog header="The Public Key is signed!" v-model:visible="openedDemo4" position="bottom">
  <p>
    Here you have the public key that is used to verify the two other resources. <br />
    Moreover, this key can be used to verify its own information resource! <br />
    This way, the owner can prove possesion of the associated private key.
  </p>
  <p>
   For this resource, all verification checks are succesfull. Looks good! <br />
   Additionally, you can now see that we model the information on the key <br />
   itself using RDF instead of some string encoding. <br />
   All of these RDF statements are covered by the signature (see the RDF-star?).
  </p>
<template #footer>
   <div class="flex justify-content-between">
      <Button
        label="End Demo!"
        class="p-button-outlined"
        @click="openedDemo4 = false; isInDemoMode = 0; lectorURI='';demoContent='';"
      />
       <Button
        label="Continue!"
        class="p-button-outlined"
        autofocus
        @click="openedDemo4 = false; isInDemoMode = 5;  openedDemo5 = true;" 
      />
      </div>
    </template>
  </Dialog>

   <Dialog header="Ready Player 1?" v-model:visible="openedDemo5" position="bottom">
   <p>
    You have successfully completed part 1 of the demo! 
    </p>
    <p>
    To continue the demo, please log in with your WebId. <br />
    You will need your Solid Pod to store your keys. <br />
    Then you can sign your own RDF graphs!
  </p>
  <p>
   {{ isLoggedIn ? 'Oh! You are already logged in. Let\'s continue!' :'' }}
  </p>
<template #footer>
   <div class="flex justify-content-between">
      <Button
        label="End Demo!"
        class="p-button-outlined"
        @click="openedDemo5 = false; isInDemoMode = 0; lectorURI='';demoContent='';"
      />
       <Button
       v-if="isLoggedIn"
        label="Continue!"
        class="p-button-outlined"
        autofocus
        @click="openedDemo5 = false; isInDemoMode = 6; if(isLoggedIn) skipToSix()" 
      />
      <LoginButton v-else/>
      </div>
    </template>

  </Dialog>
     <Dialog header="Create your own signed RDF graph!" v-model:visible="openedDemo6" position="center">
   <p>
    Now you will create a resource, sign it and store it in your Pod. </p>
    
    <ol> 
      <li>
        Please provide a URI in the inputfield at the top, e.g.
        <p> 
        <i class="text-primary" >{{webId.split("/profile/")[0]}}/public/eswc-demo</i>
        </p>
      </li>
    </ol>
    <p> 
      Do so <b>now</b> before you hit continue.
    </p>
  <p>
   {{ !isLoggedIn ?
    `
      Please log back in. Then you can continue.
    ` :''
    }}
</p>
<template #footer>
   <div class="flex justify-content-between">
      <Button
        label="End Demo!"
        class="p-button-outlined"
        @click="openedDemo6 = false; isInDemoMode = 0; lectorURI='';demoContent='';"
      />
       <Button
       v-if="isLoggedIn"
        label="Continue!"
        class="p-button-outlined"
        autofocus
        @click="openedDemo6 = false; isInDemoMode = 7; openedDemo7 = true;" 
      />
      </div>
    </template>
  </Dialog>

     <Dialog header="Sign the Resource!" v-model:visible="openedDemo7" position="center">
       <p>
    We already provided you with some content for your resource.
      </p>
   <ol start="2"> 
      <li>
        Create a Linked Data Signature:
        <p>
        <ul>
          <li> Click on the <span class="text-primary">speed dial</span> at the bottom </li>
          <li> Click on the <span class="text-primary">key symbol</span> to open the key dialog  </li>
        </ul>
        </p>
      </li>
    </ol>
        <p> 
      Do so <b>now</b> before you hit continue. 
      </p>
  <p>
   {{ !isLoggedIn ?
    `
      Please log back in. Then you can continue.
    ` :''
    }}
</p>
<template #footer>
   <div class="flex justify-content-between">
      <Button
        label="End Demo!"
        class="p-button-outlined"
        @click="openedDemo7 = false; isInDemoMode = 0; lectorURI='';demoContent='';"
      />
       <Button
       v-if="isLoggedIn"
        label="Continue!"
        class="p-button-outlined"
        autofocus
        @click="openedDemo7 = false; isInDemoMode = 8; openedDemo8 = true;" 
      />
      </div>
    </template>
  </Dialog>

     <Dialog header="Save the Resource!" v-model:visible="openedDemo8" position="center">
   <p>
     The Linked Data Signature has been added to the resource and <br />
     its signature value has been appended to the URI, now a Signed URI.
   </p>
    <ol start="3"> 
      <li>
        Save the resource to your Pod.
        <p>
        <ul>
          <li> Click on the <span class="text-primary">speed dial</span> at the bottom </li>
          <li> Click on the <span class="text-primary">floppy disk symbol</span> to save the resource </li>
        </ul>
        </p>
      </li>
    </ol>
        <p> 
      Do so <b>now</b> before you hit continue.
    </p>
<template #footer>
   <div class="flex justify-content-between">
      <Button
        label="End Demo!"
        class="p-button-outlined"
        @click="openedDemo8 = false; isInDemoMode = 0; lectorURI='';demoContent='';"
      />
       <Button
       v-if="isLoggedIn"
        label="Continue!"
        class="p-button-outlined"
        autofocus
        @click="openedDemo8 = false; isInDemoMode = 9; openedDemo9 = true;" 
      />
      </div>
    </template>
  </Dialog>


     <Dialog header="Check out your additon to the Graph!" v-model:visible="openedDemo9" position="center">
   <p>
     After you successfully saved the resource, you can...
   </p>
    <ol start="4"> 
      <li>
        Admire your addition to the document graph
        <p>
        <ul>
           <li> <span class="text-primary">Copy the resource URI</span> from the top inputfield</li>
          <li> Click on the <span class="text-primary">speed dial</span> at the bottom </li>
          <li> Click on the <span class="text-primary">left arrow symbol</span> to go back </li>
        <li> <span class="text-primary">Paste the resource URI</span> to the top inputfield</li>
        <li> Then, hit the <span class="text-primary">"GET"-Button</span> to show the graph</li>
        </ul>
        </p>
      </li>
    </ol>
        <p> 
      Do so <b>now</b> before you hit continue.
    </p>
<template #footer>
   <div class="flex justify-content-between">
      <Button
        label="End Demo!"
        class="p-button-outlined"
        @click="openedDemo9 = false; isInDemoMode = 0; lectorURI='';demoContent='';"
      />
       <Button
       v-if="isLoggedIn"
        label="Continue!"
        class="p-button-outlined"
        autofocus
        @click="openedDemo9 = false; isInDemoMode = 10; openedDemo10 = true;" 
      />
      </div>
    </template>
  </Dialog>

  <Dialog header="Pondering the Implications ..." v-model:visible="openedDemo10" position="bottomleft" style="max-width:24vw">
    <p> 
      Imagine that we were to modify our document that you just referenced from your document.
      Assume that we recalculate the Linked Data Signature.
    </p>
    <p>
   Your document would still point to the URI of our original document. 
   </p> 
   <p>
     If we update our resource at the same URI, the signature values do not match.
     If we had not recalculated the Linked Data Signature, the signature would be invalid.
     To avoid this, we have to create a new document at a new Signed URI. 
     </p>
     <p>
      You could choose to also update YOUR resource, i.e. creating a document at a new Signed URI.
      But not everyone that references our resource may be do alike. 
   Or, you may simply not even update your resource in the first place.
   </p><p class="text-primary">
   The more documents reference a particular document, the more documents need to be 
   "updated" and the more users need to be convinced to do so for a non-evident modification of a resource.
      </p>
   <!-- <p>
     <b>TL;DR</b> </p><p>
     In graph like this, consisting of documents with Linked Data Signatures available at Signed URIs, links among documents contribute the the documents' integrity.
When a document is modified, its signature value changes, the existing Signed URI mismatches and the modification becomes discoverable. 
For a modification to become undiscoverable, a new Signed URI is to be used and all documents that (transitively) reference the original documents are to be updated (with respective new Sigend URIs) as well.
Since these documents are not necessarily under control of one user but many different users, e.g. messages in a chat or comments on a post, all users have to agree on such undiscoverable updates.
Otherwise, <i>some</i> evidence will remain.
   </p> -->
<template #footer>
   <div class="flex justify-content-between">
      <Button
        label="End Demo!"
        class="p-button-outlined"
        @click="openedDemo10 = false; isInDemoMode = 0; lectorURI='';demoContent='';"
      />
       <Button
       v-if="isLoggedIn"
        label="Continue!"
        class="p-button-outlined"
        autofocus
        @click="openedDemo10 = false; isInDemoMode = 11; openedDemo11 = true;" 
      />
      </div>
    </template>
  </Dialog>



   <Dialog header="Congratulations!" v-model:visible="openedDemo11" position="center">
   <p>
     You have successfully completed part 2 of the demo! 
   </p>
  <p>
    Thank you for trying out our demo! </p>
  <p>
    If you have any remarks, questions or ideas for improvement, please let us know! <br />
    You are always welcome to open an issue in our code repository :) 
</p>
<div class="flex flex-wrap align-items-center" >
      <div style="margin:15px 0px 15px 0px;">Check out our:</div>
      <div class="flex justify-content-between">
      <Button label="Website" class="p-button-rounded" style="margin-left:10px" @click="refWebsite" />
      <Button label="Code" class="p-button-rounded" style="margin-left:10px" @click="refCode" />
      <Button label="Paper" class="p-button-rounded" style="margin-left:10px" @click="refPaper" />
    </div>
    </div>
<template #footer>
   <div class="flex-end">
       <Button
        label="Finish!"
        class="p-button-outlined"
        autofocus
        @click="openedDemo11 = false;isInDemoMode = 0; lectorURI='';demoContent='';" 
      />
      </div>
    </template>
  </Dialog>


  <div class="floating">
    <Button
      label="Help!"
      class="p-button-outlined"
      v-if="!openedDemo"
      @click="openCurrentDemoDialog"
    />
  </div>


</template>

<script lang="ts">
import { defineComponent, ref, toRefs } from "vue";
import Scribe from "@/components/create/Scribe.vue";
import Lector from "@/components/visualise/Lector.vue";
import LoginButton from "@/components/standard/buttons/LoginButton.vue";
import { useToast } from "primevue/usetoast";
import { useSolidSession } from "@/composables/useSolidSession";

export default defineComponent({
  name: "Home",
  components: { Scribe, Lector, LoginButton },
  setup() {
    const { authFetch, sessionInfo } = useSolidSession();
    const { isLoggedIn, webId } = toRefs(sessionInfo);
    const toast = useToast();
    const openedDemo = ref(true);
    const openedDemo2 = ref(false);
    const openedDemo3 = ref(false);
    const openedDemo4 = ref(false);
    const openedDemo5 = ref(false);
    const openedDemo6 = ref(false);
    const openedDemo7 = ref(false);
    const openedDemo8 = ref(false);
    const openedDemo9 = ref(false);
    const openedDemo10 = ref(false);
    const openedDemo11 = ref(false);
    const isInDemoMode = ref(0);
    const selected = ref(0);
    const scribeURI = ref("");
    const lectorURI = ref("");
    const select = (uri: string) => {
      // for demo
      if (isInDemoMode.value == 2) {
        openedDemo2.value = false;
      }
      // for usual
      console.log(uri);
      scribeURI.value = uri;
      selected.value = 1;
    };
    const unselect = () => {
      selected.value = 0;
    };
    const saveLectorURI = (uri: string) => {
      lectorURI.value = uri;
    };

    // demo
    const refWebsite = () =>
      window
        .open("https://uvdsl.solid.aifb.kit.edu/conf/2022/eswc/demo", "")
        ?.focus();
    const refCode = () =>
      window.open("https://github.com/uvdsl/solid-web-ldsig", "")?.focus();
    const refPaper = () =>
      window
        .open(
          "https://uvdsl.solid.aifb.kit.edu/conf/2022/eswc/demo-paper.pdf",
          ""
        )
        ?.focus();

    const secondDoc =
      "https://uvdsl.solid.aifb.kit.edu/public/eswc/demo__0xf47c978f0bf4dda7d3e868a1774d7160d4d80a61709458b78dd7b70724afe2599c6137ce288c97e5d3f55bcc4b3f81e5f5f09b8e645c92cbec0e4413d7fc60fb";
    // "https://uvdsl.solid.aifb.kit.edu/public/test.ttl__0x877d43e73d5db37e1c335fddcffb475f8a01be513952eccf0ac9d45d7c1657ac9d8d2e097f5dc3e4fe5bffc78b7ee1c77fbed31e2b77c8ef51c867f6ebcb8256";
    const firstDoc =
      "https://uvdsl.solid.aifb.kit.edu/public/eswc/demo__0xd90cb3d355d76dc090e298b87ef15e946478cb24a6a71ed178b5aaa90c24d01200fd8b812d6d4faf3bc3f525c40c6fb32b7557445479cb8c1a4345658a3dc474";
    // "https://uvdsl.solid.aifb.kit.edu/public/test.ttl__0xde959346ae4f31782ba7d9a936f905c5d297c07617848ceabc287004c03d3ea09942304da5cc7ae81129b61f379fe7382485e3f499c367a461f055ee50544736";
    const keyDoc =
      "https://uvdsl.solid.aifb.kit.edu/public/keys/52c13ca0-85a0-11ec-ad2c-5bab2b4d9578.ttl__0xb7898c987e2e5ba9ae6b9f28dbf89534b6d642b5d55bf2ff88555add2a55afb7f068f49a54804640c6b3c70fb8e18e061daa2b71b22e065f01294c29c6220db6";
    // "https://uvdsl.solid.aifb.kit.edu/public/keys/b6f2bf60-82bb-11ec-ad2c-5bab2b4d9578.ttl__0x8e9bfa9322c1756c2b345b31e3954018a28d4854f3db130a629db12127f3fba3beedbf5ad5e73608b993549758ecc0a4107b86c638026a053d50a07441b1f70b";

    const toastWrongView = () => {
      toast.add({
        severity: "info",
        summary: "Wrong View!",
        detail: "Swith the View using the Speeddial at the bottom.",
        life: 5000,
      });
    };

    const openCurrentDemoDialog = () => {
      console.log(isInDemoMode.value);
      switch (isInDemoMode.value) {
        case 2:
          if (selected.value == 1) {
            toastWrongView();
            return;
          }
          openedDemo2.value = true;
          break;
        case 3:
          if (selected.value == 0) {
            toastWrongView();
            return;
          }
          openedDemo3.value = true;
          break;
        case 4:
          if (selected.value == 0) {
            toastWrongView();
            return;
          }
          openedDemo4.value = true;
          break;
        case 6:
          if (selected.value == 0) {
            toastWrongView();
            return;
          }
          openedDemo6.value = true;
          break;
        case 7:
          if (selected.value == 0) {
            toastWrongView();
            return;
          }
          openedDemo7.value = true;
          break;
        case 8:
          if (selected.value == 0) {
            toastWrongView();
            return;
          }
          openedDemo8.value = true;
          break;
        case 9:
          if (selected.value == 0) {
            toastWrongView();
            return;
          }
          openedDemo9.value = true;
          break;
        case 10:
          if (selected.value == 1) {
            toastWrongView();
            return;
          }
          openedDemo10.value = true;
          break;
        default:
          openedDemo.value = true;
      }
    };
    const showDemo = () => {
      openedDemo.value = false;
      if (selected.value == 1) {
        toast.add({
          severity: "info",
          summary: "Switch View!",
          detail:
            "Go back to the GraphViz using the Speeddial at the bottom to start the demo.",
          life: 5000,
        });
        return;
      }
      // activateDemoMode
      lectorURI.value = secondDoc;
      isInDemoMode.value = 1;
    };

    const contDemo = () => {
      console.log(isInDemoMode.value);
      switch (isInDemoMode.value) {
        case 1:
          isInDemoMode.value = 2;
          openedDemo2.value = true;
          break;
        case 2:
          if (selected.value == 0) break;
          if (scribeURI.value !== firstDoc) {
            toast.add({
              severity: "info",
              summary: "Mind Tricks!",
              detail:
                "This is not the resource you are looking for. Go back and try again!",
              life: 5000,
            });
            isInDemoMode.value = 1;
            break;
          }
          isInDemoMode.value = 3;
          openedDemo3.value = true;
          break;
        case 3:
          if (selected.value == 0) break;
          if (scribeURI.value === firstDoc) {
            break;
          } else if (scribeURI.value !== keyDoc) {
            toast.add({
              severity: "info",
              summary: "Mind Tricks!",
              detail:
                "This is not the resource you are looking for. Go back and try again!",
              life: 5000,
            });
            break;
          }
          isInDemoMode.value = 4;
          openedDemo4.value = true;
          break;
      }
    };
    const demoSelect = (res: string) => {
      switch (res) {
        case "err":
          res = firstDoc;
          break;
        case "key":
          res = keyDoc;
          break;
      }
      select(res);
    };
    const skipToSix = () => {
      lectorURI.value = secondDoc;
      isInDemoMode.value = 6;
      demoContent.value = `
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>.
      
<#this> rdfs:seeAlso <${secondDoc}> .`;
      select("");
      openedDemo6.value = true;
    };
    const demoContent = ref("");
    return {
      isLoggedIn,
      webId,
      select,
      selected,
      unselect,
      scribeURI,
      lectorURI,
      saveLectorURI,
      openCurrentDemoDialog,
      refWebsite,
      refCode,
      refPaper,
      openedDemo,
      showDemo,
      isInDemoMode,
      contDemo,
      openedDemo2,
      demoSelect,
      openedDemo3,
      openedDemo4,
      openedDemo5,
      skipToSix,
      openedDemo6,
      demoContent,
      openedDemo7,
      openedDemo8,
      openedDemo9,
      openedDemo10,
      openedDemo11,
    };
  },
});
</script>

<style lang="scss" scoped>
.floating {
  position: absolute;
  bottom: 28px;
  right: 15px;
}
</style>
