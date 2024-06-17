import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';

if (ExecutionEnvironment.canUseDOM) {
    window.$crisp = [];
    window.CRISP_WEBSITE_ID = "552db003-6eba-42c7-a15e-021e0ad60ae4";
  
    // Create the script element for the Clarity tracking code
    const crispScript = document.createElement('script');
    crispScript.src = "https://client.crisp.chat/l.js";
    crispScript.async = true;
    crispScript.defer = true;
  
    // Insert the script into the head of the document
    document.head.appendChild(crispScript);
}