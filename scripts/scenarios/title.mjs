/** The title screen, with Aster gliding over the Fen. */
export default async function (h) {
  await h.go('?quality=high', 3000);
  await h.wait(5000);
  await h.shot('title');
  await h.wait(6000);
  await h.shot('title-2');
}
