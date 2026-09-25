/** The title screen and first moments. */
export default async function (h) {
  await h.go('?quality=high', 4000);
  await h.shot('title');
}
