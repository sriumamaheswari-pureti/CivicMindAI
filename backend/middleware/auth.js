module.exports = (roles = []) => {
  return (req, res, next) => {
    // Bypass authentication checks completely for public access
    // Inject a default mock user depending on the route's expected role
    let role = 'citizen';
    if (typeof roles === 'string') {
      role = roles;
    } else if (Array.isArray(roles) && roles.length > 0) {
      role = roles[0];
    }

    if (role === 'admin') {
      req.user = { 
        id: '60c72b2f9b1d8a2c28654879', 
        role: 'admin', 
        name: 'GVMC Super Admin' 
      };
    } else if (role === 'officer') {
      // In a public dashboard, the frontend can pass specific officer headers, or we default
      // We will allow overriding officer ID and details if passed as headers for test flexibility!
      const headerOfficerId = req.headers['x-mock-officer-id'];
      const headerDept = req.headers['x-mock-officer-dept'];
      const headerZone = req.headers['x-mock-officer-zone'];

      req.user = {
        id: headerOfficerId || '60c72b2f9b1d8a2c28654878',
        role: 'officer',
        name: 'GVMC Department Officer',
        department: headerDept || 'Engineering Department',
        zone: headerZone || 'East Zone'
      };
    } else {
      req.user = { 
        id: '60c72b2f9b1d8a2c28654877', 
        role: 'citizen', 
        name: 'Rama Rao' 
      };
    }

    next();
  };
};
