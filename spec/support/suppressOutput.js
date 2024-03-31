/*
 * @param before1 function to run before all specs and suppressing output
 * @param before2 function to run before all specs but after suppressing output
 * @param after1 function to run after all specs but before unsuppressing output
 * @param after2 function to run before all specs and unsuppressing output
 */
function suppressOutput(before1 = () => {}, before2 = () => {}, after1 = () => {}, after2 = () => {}) {
   let toSuppress = ["log", "debug", "warn", "info"];
   let methods = {};
   beforeAll(() => {
      before1();

      for (let i = 0; i < toSuppress.length; i++) {
         let m = toSuppress[i];
         methods[m] = console[m];
         console[m] = () => {};
      }

      before2();
   })
   afterAll(() => {
      after1();

      for (let i = 0; i < toSuppress.length; i++) {
         let m = toSuppress[i];
         console[m] = methods[m];
      }

      after2();
   })
}

module.exports = suppressOutput;
