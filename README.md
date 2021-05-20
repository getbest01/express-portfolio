# Portfolio-Node.js
## Description
> Backend server on Heroku working as a proxy server to fetch data from 3rd party API providers and running PostgreSQL databse table for Fiscal Trace portfolio.  

## Stack
* CI/CD on Heroku
* Express framework on node.js
* PostgreSQL

## Structure
* **file name**: api.js
* Used CORS whitelist for limiting server access from registerd clients only
* Usages by each portfolio
    > Name   |   Router   |   Parameters   |   Description   |
    > ---   |   ---  |   --- |   --- |
    > Fiscal Trace   |   /json   |   NA   |   Initial load from database   |
    >  |  |   /replace   |   all fiscal data   |   replace existing data with submited data   |
    >    Weather   |   /weather   |   city, # of days, alert   | fetch weather data by city   |
    > |   |   /weathergeo   |   latitude, longitude, # of days, alert   | fetch weather data by current geolocation   |
    > PGA Tour   |   /pga-tourlist   |   season   |   fetch PGA tour schedule by season |
    > |   |   pga-leaderboard   |   tourID   | fetch PGA tour leaderboard by tour ID   |
    > |   |   pga-news   | NA   | fetch most recent PGA news   |
    

    

