export const fmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN')
export const initials = (name) => name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
