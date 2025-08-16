Notes to implement (FE):

1. Login still doesn't update top bar - move to backlog
2. Analytics needs to be implemented correctly.  (backend req) backlog as well
3. QUICK ACTIONS Should be `Punch Up`, `Apply to Job`, and `View Library`
4. Remove Ready for your next optimization card
5. Job Analysis Page - Add Optional Job Title input.  Otherwise AI will attempt to pull from the pasted content.
  - On Click of `Analyze Job Mathch` button remove the bottom spinner and the `AI is comparing your resume against the job requirements to identify...` text field.
  - We will need to build out the analysis results to make sure it's actually pulling from the data and accurate
  - lets change the red down arrows to something a bit more positive.  we can use the red highlighting, but pick a different icon
  - jump scroll view to the top of the page on completion of the api call. this should also happen on movement to the next page.
  - check filters

6. Review Page
  - Changes Summary review logic
  - rename the following tabs [PDF Preview -> Preview] also merge with [Make Any Final Tweaks -> Edit], [Side by Side -> Compare], [Unified Diff -> remove for now], [Latex Export -> remove for now]
  so in the end there will only be two tabs for the user. preview and side by side
  - make Preview just display the updated text. the pdf will likely still be generating on the backend, and when that finishes we should ONLY then generate the export button

  - Update UI so we see when the pdf is ready.  It should be a loading spinner and then populate the Preview pane
  - Make Sure Side By Side works, should be raw text based.

  Finally, at the bottom of the page, add a card with the option to `Optimize for another job`, or return home.

7. Library Page
Review current functionality and remove unnecessary data.  We should have the option to rename the resume, see the history (which resumes it was derived from), see the job description it was based off of, 

8. Download Page
The Resume Preview should display the PDF!. Remove the top card that is redundantly saying `resume optimization complete`.  Remove the `What's Next?` card.

BACKLOG:
==============
So there are two flows in the end.
Resume-Job Description Flow **FOCUS ON THIS FOR NOW**
Resume Solo Flow (please add coming soon and we'll work on later)
map out the request flow into a document
Export shouldn't be at the top list of steps with Resume, Job Analysis, Optimize, Review.  Export is it's own thing.
add the element from the v0 version that let's the user toggle between sign in and sign up with a wide switch.
Look into OATH

