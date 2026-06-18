import { AgenciesService } from "../src/services/agencies.service.ts";

try {
  const agencies = await AgenciesService.listForAdmin();
  console.log("OK", agencies.length, "agencies");
  console.log(JSON.stringify(agencies, null, 2));
} catch (e) {
  console.error("FAIL", e);
}
