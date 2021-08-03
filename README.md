# Course-Scheduler

## Description
This project creates a website which helps students choose their courses of interest and plan out their course schedules in real-time. The initial version contains all the CS and AI courses offered by IIT KGP during the Autumn Semester 2021-2022. 

## Components
* Back-end: Public APIs exposed through a PHP script running on a server
* Frontend: Composed of static HTML pages, stylesheets and dynamic updates using vanilla JavaScript


## APIs Exposed
The following 3 APIs are exposed to the user:

* `?all=true` : Returns all the available subjects


    Example Response:
    
      
        [ "AI", "CS"]
      
      
* `?all=true&subject=CS` : Returns all the courses offered by the specified department(subject)

    Example Response:
    
      
        ["CS31005 - ALGORITHMS - II", "CS21201 - DISCRETE STRUCTURES", "CS60077 - REINFORCEMENT LEARNING"]
      
      
* `?subject=CS&course=143` : Returns all the data for CS course 143. This includes: 
  * Course Name
  * Course Number
  * Course Instructor 
  * Course Description
  * Credit
  * Timings

   Example Response:
    
    ```javascript
    {"course_number":"CS143","course_name":"Test Course","course_description":"Test Course Description","instructor":"Test Instructor","credits":"4","timings":{"Monday":[{"start":"12:00","end":"13:55"}],"Tuesday":[{"start":"9:00","end":"9:55"}]}}
    ```

## Files
* `index.html` - Website Home page
* `index.css` - Stylesheet for index.html
* `index.js` - Vanilla Javascript to update index.html dynamically
* `index.php` - Server-side PHP script
* `contracts.json` - Sample data-contract shared by PHP and Javascript
* `subjects/` - All possible subjects available and each file contains the course number and names available for that subject
* `courses/` - Course details for each course offered under every subject

## Working Example
A working example of this project is hosted here: http://anupamguptacalcom.ipage.com/Course_Scheduler/index.html
