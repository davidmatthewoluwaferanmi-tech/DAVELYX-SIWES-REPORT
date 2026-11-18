// Shared DAVELYX marketplace configuration.
export const NIGERIA_STATES = ['Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno','Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','Gombe','Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba','Yobe','Zamfara','FCT - Abuja'];
export const DEFAULT_AVATAR = '/assets/images/default-avatar.png';
export function avatarInitial(name = 'D') { return String(name || 'D').trim().charAt(0).toUpperCase() || 'D'; }
export function avatarMarkup(url, name, className = 'avatar') {
  const safeName = String(name || 'User').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  return url ? `<img class="${className}" src="${String(url).replace(/["<>]/g, '')}" alt="${safeName}" loading="lazy">` : `<span class="${className} avatar-fallback" aria-label="${safeName}">${avatarInitial(name)}</span>`;
}
