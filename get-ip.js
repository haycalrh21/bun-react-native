const os = require("os");

function getLocalIP() {
  const interfaces = os.networkInterfaces();

  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
      if (interface.family === "IPv4" && !interface.internal) {
        console.log(`Your local IP address is: ${interface.address}`);
        console.log(
          `Add this to your auth trusted origins: http://${interface.address}:8081`
        );
        console.log(`And this for Expo Go: exp://${interface.address}:8081`);
        return interface.address;
      }
    }
  }

  console.log("Could not find local IP address");
  return null;
}

getLocalIP();
