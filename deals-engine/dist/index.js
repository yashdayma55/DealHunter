import { supabase } from "./supabaseClient";
async function test() {
    const { data, error } = await supabase
        .from("categories")
        .insert({ name: "test-category" })
        .select();
    console.log("Inserted:", data);
    console.log("Error:");
    console.dir(error, { depth: null }); // <-- shows real error details fully
}
test();
