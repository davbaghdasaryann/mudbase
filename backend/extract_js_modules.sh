#!/bin/bash
# Extract JavaScript modules from frontend.html

sed -n '1865,2063p' frontend.html | sed 's/^      //' > frontend/js/auth.js
sed -n '2065,2334p' frontend.html | sed 's/^      //' > frontend/js/ui.js  
sed -n '2339,2778p' frontend.html | sed 's/^      //' > frontend/js/estimates.js
sed -n '4056,4363p' frontend.html | sed 's/^      //' > frontend/js/materials.js
sed -n '4423,5018p' frontend.html | sed 's/^      //' > frontend/js/labor.js
sed -n '4364,4422p' frontend.html | sed 's/^      //' > frontend/js/users.js
sed -n '2137,2333p' frontend.html | sed 's/^      //' > frontend/js/accounts.js
sed -n '2223,2333p' frontend.html | sed 's/^      //' > frontend/js/catalog.js
sed -n '5859,5971p' frontend.html | sed 's/^      //' > frontend/js/dashboard.js
sed -n '5924,5971p' frontend.html | sed 's/^      //' > frontend/js/account-data.js

echo "JavaScript modules extracted"
