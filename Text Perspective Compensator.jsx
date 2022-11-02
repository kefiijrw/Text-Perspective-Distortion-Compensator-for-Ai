/*! 
 * Text Perspective Distortion Compensation v.0.0.7
 * https://github.com/kefiijrw/Text-Perspective-Distortion-Compensation-for-Ai
 *
 * Author: Sergey Nikolaev
 * kefiijrw.com
 *
 * Date: 2022-11-02
 *
 */


// show the settings panel on startup
var ui = true;

//do we write in the log file
var debug_mode = false;

// ratio millimeters to points
var mm = 2.834645;



// Distance to the target in centimeters
var distance = 250;

// compensation coefficient (vertical stretching) from 0 to 1 
// 0 – without compensation 
// 1 — the top line is optically exactly like the bottom line
var perspective_coeff = 0.5;

// character shape compensation coefficient (horizontal stretching) from 0 to 1
// 0 – letters are stretched only vertically 
// 1 — letters are stretched horizontally as much as vertically
var scale_coeff = 0;

// leading compensation coefficient from 0 to 1
// 0 — leading remains the same
// 1 — leading will increase as much as the height of the characters
var leading_coeff = 0;

// eye level of the viewer, determine by the line in the eyes_level layer, converted to cm
var eyes_level;

// How to make the script increase the vertical scale of the letters:
// true – letters grows only upwards to keep their baselines in place
// false – letters grows in both directions - up and down - and generally stays in its place
var keep_baseline = false;

// when the script runs when nothing is selected:
// false – alert warning
// true – process all text fields
var all_text = true;

// Working with current documents
var doc = app.activeDocument;

// a global variable (sorry) to store the current text being processed
var current_txt;







/*
  

  SOME HELPING FUNTIONS


*/


//write a line in the log file (sorry, bad habit)
function echo(what) {
   if (debug_mode)
      log_file.write(what + '\n');
}


// rounding values of coefficients to .00 to show in inputs
function roundOff(x) {
   
   var place = 100;
   x = Math.round(x * place);
   x /= place;
   
   return x;
}



// return the line in the right language, depending on the illustrator's locale
function loc(vars) {
   if (app.locale.indexOf('ru_') == 0)
      return vars.ru;
   else
      return vars.en;
}




// Open link. 
// Took it from here: https://community.adobe.com/t5/indesign/js-scriptui-url-links-in-dialogues/td-p/4572773?page=1
function GotoLink(url) {

   url = url || "https://github.com/kefiijrw/Text-Perspective-Distortion-Compensation-for-Ai";

   if (!/^http/.test('' + url)) {
      url = 'https://' + url;
   }

   if (app.version > 6) {

      if (File.fs == "Macintosh") {

         var body = 'tell application "Finder"\ropen location "' + url + '"\rend tell';
         app.doScript(body, ScriptLanguage.APPLESCRIPT_LANGUAGE);

      } else {

         var body = 'dim objShell\rset objShell = CreateObject("Shell.Application")\rstr = "' + url + '"\robjShell.ShellExecute str, "", "", "open", 1 ';
         app.doScript(body, ScriptLanguage.VISUAL_BASIC);

      }

   }

   else {

      var linkBody = '<html><head><META HTTP-EQUIV=Refresh CONTENT="0; URL=' + url + '"></head><body> <p></body></html>';
      var linkJumper = File(Folder.temp.absoluteURI + "/link.html");
      linkJumper.open("w");
      linkJumper.write(linkBody);
      linkJumper.close();
      linkJumper.execute();

   }

}














/*

  CONFIG OPERATION FUNCTIONS

*/



// Read presets from illustrator settings
function init_configs() {
   echo('init_configs');

   //flag in the illustrator settings saying that the script has already been run before
   var was = app.preferences.getIntegerPreference('perspective_compensation_script_first_launch_already_was');

   if (was != 6) { //very dumb, sorry. it didn't work to save boolean so 6 is true and 2 is false

      //first launch
      echo('first_launch!');

      //save these values in illustrator settings
      from_vars_to_prefs();

      //remember that first launch was
      app.preferences.setIntegerPreference('perspective_compensation_script_first_launch_already_was', 6);


   } else {

      echo('not first launch');

      //not first launch
      //read script settings from illustrator settings
      from_prefs_to_vars();

   }

}

// saving current state (coefficients, presets, checkboxes) to the illustrator settings, so they can be recovered again after restarting the illustrator

function from_vars_to_prefs() {

   echo('from_vars_to_prefs ');

   app.preferences.setRealPreference('perspective_compensation_script_current_distance', distance);

   app.preferences.setRealPreference('perspective_compensation_script_current_perspective_coeff', perspective_coeff);
   
   app.preferences.setRealPreference('perspective_compensation_script_current_scale_coeff', scale_coeff);
   
   app.preferences.setRealPreference('perspective_compensation_script_current_leading_coeff', leading_coeff);

}


//opposite, restoring the state of the script from the saved illustrator settings

function from_prefs_to_vars() {
   echo('from_prefs_to_vars');

   distance = app.preferences.getRealPreference('perspective_compensation_script_current_distance');

   perspective_coeff = app.preferences.getRealPreference('perspective_compensation_script_current_perspective_coeff');

   scale_coeff = app.preferences.getRealPreference('perspective_compensation_script_current_scale_coeff');

   leading_coeff = app.preferences.getRealPreference('perspective_compensation_script_current_leading_coeff');

}



//full reset, as if the script had never been run before
function factory_reset() {
   echo('factory_reset');

   app.preferences.removePreference('perspective_compensation_script_first_launch_already_was');

   app.preferences.removePreference('perspective_compensation_script_current_distance');
   app.preferences.removePreference('perspective_compensation_script_current_perspective_coeff');
   app.preferences.removePreference('perspective_compensation_script_current_scale_coeff');
   app.preferences.removePreference('perspective_compensation_script_current_leading_coeff');

}












/*
  

  CORE FUNCTIONS


*/


// root function
function main() {
   echo('=====================================');
   echo('main with settings ' + distance + '; ' + perspective_coeff + '; ' + scale_coeff + '; ' + leading_coeff);

   var where;
   
   // determining eye level
   try{


      if(doc.layers.getByName('eyes_level').pathItems.length > 0){

         var obj = doc.layers.getByName('eyes_level').pathItems[0];

      } else if( doc.layers.getByName('eyes_level').groupItems.length > 0){

         var obj = doc.layers.getByName('eyes_level').groupItems[0].pathItems[0];         

      } 

      eyes_level = (-obj.top) / (10 * mm);

   } catch(err){

      alert(loc({'ru':'Нет отметки уровня глаз\nДля скрипта нужен слой eyes_level и линия в нем, определяющая уровень глаз относительно макета', 'en':'No eye level marker\nYou need the eyes_level layer and a line in it that determines the level of the eyes relative to the text'}));
      
      return false;
   }


   //which text fields we process
   if (doc.selection.length > 0) {

      where = doc.selection;

   } else {

      if(all_text){

         where = doc.textFrames;

      } else{

         alert(loc({'en':'Nothing selected\nSelect text fields and run the script again', 'ru':'Ничего не выделено\nВыделите текстовые объекты и запустите скрипт снова'}));

         return false;

      }

   }


   //recursive walkover of the selection and processing of text fields within it
   //get the number of processed text fields
   var total = recursive_txt(where);

   //check if there were any text fields in the selection at all 
   if(total == 0){
      alert(loc({'en':'Nothing selected\nSelect text fields and run the script again', 'ru':'Ничего не выделено\nВыделите текстовые объекты и запустите скрипт снова'}));
      return false;
   }

   return true;
}


/**
 * recursive parsing of where_is content in search of text fields
 */
function recursive_txt(where_is) {
   echo('=recursive_txt');
   echo(where_is.length);

   //number of processed text fields
   var found = 0;
   

   /**
    * where_is can be a group or a text field or just a set of different selected objects
    * for each possible case we try our own methods
    */

   try {

      // If it is a set of objects
      for (var j = 0; j < where_is.length; j++) {
         echo(j + ' of ' + where_is.length + '; try 1');
         echo(where_is[j].typename);

         if (where_is[j].typename == 'TextFrame') {
            // text box - let's do it!
            
            calc_txt(where_is[j]);
            found++;

         } else if (where_is[j].typename == 'GroupItem') {
            // group - let's go down a level
            found += recursive_txt(where_is[j]);
            
         }

      }
   } catch (e) { }

   //If there are text fields in where_is, run the algorithm on them
   try {
      for (var j = 0; j < where_is.textFrames.length; j++) {
         echo(j + ' try 2');
         
         calc_txt(where_is.textFrames[j]);
         found++;
         
      }
   } catch (e) { }

   //If there are groups in where_is, search through them
   try {
      for (var j = 0; j < where_is.groupItems.length; j++) {
         echo(j + ' try 3');
         
         found += recursive_txt(where_is.groupItems[j]);
         
      }
   } catch (e) { }
  
   return found; 
}


/**
 * Root function of txt text field processing
 * Makes a few checks and starts the job
 */
function calc_txt(txt) {
   
   echo('==calc_txt');
   echo(' ');

   // if the text field is shown...
   if (txt.hidden == false && txt.layer.visible == true) {

      // ...then let's do it!
      try {

         current_txt = txt;
         compensate_text(txt);
         
      } catch (err) {
         echo('ERROR ' + err);
      }


   }
   
}





/**
 * Compensates perspective distortions of the txt text field
 */
function compensate_text(txt) {
   
   echo('===compensate_text');

   // text field type (Point Type, Area Type, Path Text).
   // the script works with the first two options, it ignores the Path texts
   var kind = txt.kind;

   /**
    * [y] stores the coordinate of the current line needed to calculate the distortions.
    * Illustrator does not provide line coordinates, so we have to count it  
    * ourselves by scanning the text field line by line and adding leading.
    * For the first line we take the coordinate of the whole text field...
    */
   var y = txt.top;

   /**
    * ...and slightly lower so that we land somewhere on the level of the center of the lowercase letters.
    * The leading of the first line has no effect on anything, so we take the font size.
    * But actually, the position of the typing line depends on the font metrics, and there is no access to them,
    * so this is just a approximate targeting of the letters of an average font
    */
   y -= txt.lines[0].characterAttributes.size / 2;



   if (kind == TextType.AREATEXT) {
      /**
       * If it is an area type, the text is divided into paragraphs and within them into lines
       */

      echo('AREA TYPE');

      // go through the list of paragraphs
      for (var j = 0; j < txt.paragraphs.length; j++) {
         echo(' ');
         echo(' ');
         echo('paragraph ' + j);

         var par = txt.paragraphs[j];

         //if it is not the first paragraph, then count the margin before it
         if (j != 0) {
            y -= par.paragraphAttributes.spaceBefore;
         }


         // go through the list of lines in the paragraph
         for (var i = 0; i < par.lines.length; i++) {

            var line = par.lines[i];
            // echo(' ');
            // echo(' ');
            // echo('   >line ' + i + ': ' + line.contents);
            // echo('   >line len is ' + line.characters.length);
            

            // process this line, in response we get an updated y-coordinate, 
            // considering the distortions and the changed position of the line
            
            y = compensate_line(par, i, i + j == 0, y);
            
            // echo('   >new line len is ' + par.lines[i].length);
            // echo('   >new line is ' + par.lines[i].contents);

         }
         // echo('end of paragraph' +y);

         //don't forget about the margin at the end
         y -= par.paragraphAttributes.spaceAfter;

      }

   } else if (kind == TextType.POINTTEXT) {
      /**
       * If it is a point type, it`s stupid: instead of splitting 
       * into paragraphs the text is split into lines only, but at the end 
       * of some lines (which are inside the paragraph) there is a forced line break, 
       * and at the end of other lines (the end lines of the paragraph) 
       * there is a usual line break character \r. 
       */

      echo('POINT TYPE');

      // We take all the text and divide it by the carriage return character, so we divide it into paragraphs
      var cont_par = txt.contents.split('\r');

      // Paragraph text is divided to lines by the Force break character
      for (var i = 0; i < cont_par.length; i++) {
         cont_par[i] = cont_par[i].split('');
      }

      /**
       * So we get cont_par, a 2-dimensional array with the text of the lines inside the paragraphs.
       * But we must still interact with the real lines of the illustrator
       * So we'll loop through the lines of the text field, 
       * but at the same time we'll watch where we are in the 
       * two-dimensional array of lines, and so we will catch 
       * the beginnings and ends of paragraphs. Hail to the Shitcode!
       */

      //the coordinates of the current line in the two-dimensional array cont_par 
      var j = 0, k = 0;

      // flag "this line was the last one in the paragraph"
      var was_last = false;

      // go through all the lines of the text box
      for (var i = 0; i < txt.lines.length; i++) {

         var line = txt.lines[i];
         echo('>line ' + i);

         //if the last line of the paragraph was before it, then add a pre-paragraph margin
         if (was_last == true) {
            y -= line.paragraphAttributes.spaceBefore;
            was_last = false;
         }

         // process this line, in response we get an updated y-coordinate, 
         // considering the distortions and the changed position of the line

         y = compensate_line(txt, i, i == 0, y);
         
         //synchronize line coordinates in a two-dimensional array
         if (line.contents == cont_par[j][k]) {

            //if it is the last line in the paragraph,
            if (k == cont_par[j].length - 1) {

               // echo('LAST');
               // then add post-abbreviation access
               y -= line.paragraphAttributes.spaceAfter;
               j++;
               k = 0;
               was_last = true;

            } else {
               k++;
            }

         } else {
            echo('WTF:');
            echo(line.contents);
            echo(cont_par[j][k]);
         }

      }

   }
   

}


/**
 * The function compensates for distortions for the line. 
 * The string is not passed directly, but as `line_n` number in the `txt` 
 * text field to be able to communicate with neighboring lines.
 * 
 * @param {textFrame} txt - the text field or paragraph to which the line belongs
 * @param {number} line_n - the line number in this text field
 * @param {bool} is_first_line - is this the first line in the text field
 * @param {number} y - [y] coordinate of the line
 * return the updated [y] coordinate after all distortions
 */
function compensate_line(txt, line_n, is_first_line, y) {
   
   // echo('====compensate_line');

   var line = txt.lines[line_n];

   // count the original leading of the string before our intervention
   var original_leading = calc_leading(line);
   
   // echo('   original leading is '+original_leading);

   // if it is not the first line of the first paragraph...
   if (!is_first_line) {

      // ...then lower the coordinate by the leading of the line being counted, 
      // so that it indicates the character level
      y -= original_leading;

      // echo('   down step original leading = ' + original_leading);

   } else {
      // echo('   first line, ignoring original leading');
   }

   /**
    * Since after calculating the stretch at [y] level the line 
    * with leading compensation will shift vertically, 
    * the compensation will be invalid (it was calculated for one position, 
    * and the line now stands in another), and for this you must recalculate 
    * for the new level of the line. And then another and another... 
    * It is determined by experience that in three iterations the process 
    * converges to an error of 0.06% (at least on the test layouts).
    */


   //number of counts
   var cicle_count = 1;

   /**
    * It makes sense to do this only if the leading is compensated, 
    * which means that the line is moved vertically because of compensation 
    * for distortion, and if it is not the first line of the text field, 
    * because its leading has no effect at all on anything
    * */
   if (leading_coeff > 0 && !is_first_line) {
      //TODO: instead of the approximate number iterate until some accuracy is reached
      cicle_count = 2;
   }

   var previus_leading = original_leading;

   //approaches to string counting
   for (var i = 0; i < cicle_count; i++) {

      
      // echo(' ');
      // echo('      trying ' + (i+1) + ', calculate for y = ' + y);

      //we apply the distortions and get a new line leading in response
      
      var new_leading = calc_line(txt, line_n, y, original_leading, i);
      

      //if it is not the first line of the first paragraph
      if (!is_first_line) {

         // echo('      new_leading = ' + new_leading);

         /**
          * Correct the [y] coordinate by the difference between the previous 
          * and the new leading, so that it reaches the shifted line
          * */
         y -= (new_leading - previus_leading);

      } else {

         // echo('      ITS first line, ignore leading changes');

      }

      previus_leading = new_leading;
   }

   
   return y;

}




/**
 * Function to determine the leading of a line.
 */
function calc_leading(line) {
   

   /**
    * Since the real vertical offset of a line from the previous line 
    * depends on the maximum leading of characters of this line, 
    * we will go through the line symbol by symbol. 
    * We should also remember about possible auto leading.
    * */

   var max_leading = -1;
   var lead;

   // if the line has auto leading
   // TODO: but what if different characters of this line have different values?
   if (line.characterAttributes.autoLeading == true) {
      // echo('autoLeading');

      //go around all the characters in the line
      for (var i = 0; i < line.characters.length; i++) {

         //count through the autoLeading value (percentage of the fontsize). convert it to points
         lead = line.characters[i].characterAttributes.size * line.characters[i].paragraphAttributes.autoLeadingAmount / 100;

         //Update maximum
         if (lead > max_leading) {
            max_leading = lead;
         }

      }

   } else {
      //if the leading is set directly

      // echo('not autoLeading');

      for (var i = 0; i < line.characters.length; i++) {

         // It's simpler here - we just take it from the properties
         lead = line.characters[i].characterAttributes.leading;

         if (lead > max_leading) {
            max_leading = lead;
         }

      }



   }

   // echo(max_leading);
   
   return max_leading;
}



/**
 * The function where transformations are directly applied to the line
 * The line here is also passed indirectly, as in the parent function compensate_line()
 * @param {*} txt - the text field or paragraph to which the line belongs
 * @param {*} line_n - the line number in this text field
 * @param {*} y - [y] coordinate of the line
 * @param {*} original_leading the original line spacing. Since this function can be 
 * applied to a line several times (see compensate_line), 
 * the line may already have a compensated leading, 
 * so the original leading is saved for calculation.
 * 
 * Return the new leading of this line.
 */
function calc_line(txt, line_n, y, original_leading, iteration) {
   
   echo('=====calc_line');

   var line = txt.lines[line_n];

   /**
    * If this is not the first run of the line, 
    * the leading is already stretched, 
    * and if some characters are migrated to the next line, 
    * they will stretch it with their leading. 
    * So reset the leading - it will still be set later, 
    * but only to characters that remain on the line.
    */
   if(iteration != 0){
      line.characterAttributes.leading = original_leading;
   }


   /**
    * we set the coordinates of the line in cm, 
    * so that it is in the same dimensionality 
    * as distance and eye_level
    */
   var y_in_cm = -y / (10 * mm);


   /**
    * Calculate the compression ratio by the distance of the line from eye level.
    * y_comp ranges from 1 (no distortion) to infinity (super distortion)
    */
   var y_comp = compensation(Math.abs(y_in_cm - eyes_level));
   

   /**
    * Recalculate with the distortion coefficients 
    * The set of values is the same, from 1 (no distortion) to infinity
    * Ranges the same: from 1 (no distortion) to infinity (super distortion)
    */
   var y_perspective_coeff = (y_comp - 1) * perspective_coeff + 1;
   var y_scale_coeff       = (y_comp - 1) * scale_coeff + 1;

   // echo('y_in_cm: '+y_in_cm);
   // echo('eyes_level: '+eyes_level);
   // echo('d: '+Math.abs(y_in_cm - eyes_level));
   echo('coef: '+y_comp.toFixed(2));
   // echo('y_perspective_coeff: '+y_perspective_coeff);
   // echo('y_scale_coeff: '+y_scale_coeff);

   
   
   //horizontal scale of line characters
   line = set_hor_scale(line, y_perspective_coeff, y_scale_coeff, txt, line_n);
   
   //vertical scale
   set_vert_scale(line,y_perspective_coeff, y_scale_coeff);
   
   //leading
   var upd_leading = set_leading(line, original_leading, leading_coeff);

   return upd_leading;


}

// Calculating the horizontal scale of line characters
function set_hor_scale(line, y_perspective_coeff, scale_coeff, txt, line_n){
   
   /**
    * There is a horizontal stretching of characters, 
    * which can make the text in the Area Type not fit 
    * and jump from line to line, it is necessary 
    * to catch all sorts of side effects
    */

   //only if the horizontal scale is affected
   if (scale_coeff == 0){ 
      return line;
   }
   

   // var hor_scale_compensated = 100 + (y_perspective_coeff * 100 - 100) * scale_coeff;
   var hor_scale_compensated = 100 * scale_coeff;

   // echo('>>>' + line.start + ' -> ' + line.end);

   
   // echo('horizontalScale: ' + hor_scale_compensated);

   //If it is a Point text
   if(current_txt.kind == TextType.POINTTEXT){

      //apply a horizontal stretch to the symbols that corresponds to their position    
      line.characterAttributes.horizontalScale = hor_scale_compensated;
      
   //If it is a Area Type   
   } else if(current_txt.kind == TextType.AREATEXT){
      
      // echo('>>>' + line.start + ' -> ' + line.end);

      /**
       * Now the line may not be on its own line at all: 
       * some characters may have flowed to the next line, 
       * some, on the other hand, narrowed and jumped 
       * to the previous line, where they did not fit 
       * with the previous level of stretch. 
       * It is time to hunt for runners.
       */

      // the text field or paragraph in which everything happens
      // TODO: Is it necessary to create this variable here or can the original be spoiled as well?
      var range = txt;
    

      /**
       * First, apply the horizontal stretch of the current line 
       * to all characters below, so that if someone from the next 
       * line decides that he can now fit on the previous line as well, 
       * he will do so now. 
       */

      //set the beginning of this text range to the beginning of our string, preserving the original value
      var w = range.start;
    
      range.start = line.start;
    
      range.characterAttributes.horizontalScale = hor_scale_compensated;
    

      //Return the limits of the text range back
      range.start = w;
    


      //see what's on this line now after all the characters have potentially escaped to the lines before and after
      var line_updated = txt.lines[line_n];
    

      // echo('length before horizontalScale: ' + line.length);
      // echo('length after horizontalScale: ' + line_updated.length);
      // echo(line.contents + ' -> ' + line_updated.contents);

      /**
       * The variable line still stores all characters of the original string, 
       * even if they are spread over neighboring strings after stretching. 
       * So we can compare the original string with what appeared in its place after the distortion
       */

      //where the new line is in the old line
      var i1 = line.contents.indexOf(line_updated.contents);

      //where the old line is in the new
      var i2 = line_updated.contents.indexOf(line.contents);

      // echo(i1 + ' & ' + i2);

      if (i1 == 0 && i2 == 0) {
         // lines are equivalent, i.e. the line remains in its place completely, we can do nothing additionally
         // echo('equal');

      } else if (i1 == 0 && i2 == -1) {
         /**
          * The line is reduced, for example:
          * Lorem ipsum dolor sit amet, consectetuer adipiscing  -> Lorem
          * So some characters did not fit and ran to the next line
          * Override the line variable so that only what is actually 
          * left on the line gets the rest of the distortion
          */

         // echo('SHORTER, CHANGE LINE');
         line = line_updated;
         // echo('new line is ' + line.contents);

      } else if ( i1 == -1 && i2 == 0 ) {
         /**
          * The line is extended, for example:
          * consec -> consectetuer 
          * So some characters from the next line used to be even wider, 
          * and now they've narrowed down a bit and returned to this line
          * Same thing, redefine the variable line
          */

         // echo('LONGER, CHANGE LINE');
         line = line_updated;
         // echo('new line is ' + line.contents);

      } else if ( i1 != 0 && i2 == -1 ) {
         /**
          * The beginning of the line moved to the previous line, for example:
          * elit, sed diam  -> sed diam 
          * At the end, new characters may also be added because of the empty space.
          * Since the characters jumped up there is not appropriate 
          * (they are there only because they have a horizontal stretch factor 
          * calculated for the line below, and if you recalculate it for the new level, 
          * they again will not fit and go back, but again, with another level of 
          * stretch, etc., etc.), we must bring them back down.
          * To do this, the "do not break" style is applied to these escaped 
          * and following characters, then they will not be able to 
          * fit on the top line and will return to their homeland.
          */

         // echo('LETS TURN BACK TO THIS STRING');
         // echo(line.start + ' -> ' + line.end);
         // echo(line_updated.start + ' -> ' + line_updated.end);

         /**
          * We go from the beginning of the original string and 
          * end with the beginning of the updated one, That is, 
          * these are just the characters that ran to the previous line
          */
         for (var i = line.start; i <= line_updated.start; i++) {
            // echo(i+': '+txt.characters[i].contents);
            //TODO: would it be faster if not one character at a time, but the range at once?
            txt.characters[i].characterAttributes.noBreak = true;
         }

         // echo('CHANGE LINE');
         /** 
          * Since we put those characters back and now don't know where anything is, 
          * instead of assigning line_updated we take the string again and give it a stretch
          * TODO: Why can't you do that in other places?
         */
         line = txt.lines[line_n];
         line.characterAttributes.horizontalScale = hor_scale_compensated;
         // echo('new line is ' + line.contents);

      } else {
         echo('WTF');
      }

   }

   
   return line;
   
}



// Calculating the vertical scale of line characters
function set_vert_scale(line, y_perspective_coeff, y_scale_coeff){
   
   /** 
    * The vertical stretching of the characters is simple, because it does not move anything
    * */
    var vert_scale = y_perspective_coeff * y_scale_coeff * 100;
   
   /** 
    * the script runtime strongly depends on the number 
    * of times the properties are applied to the text, 
    * so we have to do extra checking for optimization 
    * */
   if( line.characterAttributes.verticalScale != vert_scale){
      line.characterAttributes.verticalScale = vert_scale;
   }

   echo('vScale: ' + vert_scale.toFixed(2));
   
   if(!keep_baseline){
      // consider how much vertically to drop the text, so that the line grows not upwards, but in both directions and generally stays in its place when you increase the vertical scale
      var shift_in_percents = (vert_scale - 100)/2;
      var shift_in_points = line.characterAttributes.size*shift_in_percents/100;
      line.characterAttributes.baselineShift = -shift_in_points/2;

      
      echo('shift_in_percents: ' + shift_in_percents);
      echo('shift_in_points: ' + shift_in_points);
      echo('baselineShift: ' + line.characterAttributes.baselineShift);
   }
   
}


// Calculating the interlineation
function set_leading(line, original_leading, leading_coeff){
   

   if (leading_coeff > 0) {

      // echo('leading too!');
      // set_leading(line, original_leading, leading_coeff);

      //TODO: Fix this nonsense to something normal
      var l = line.characters.length - 1;
      var style2 = line.characters[l].characterAttributes;

      if (style2.autoLeading == true) {

         //TODO: Is this even necessary or is it enough to assign a lead?
         line.autoLeading = false;

      }

      //count the new interlinear
      line.characterAttributes.leading = original_leading * (100 + (line.characterAttributes.verticalScale - 100) * leading_coeff) / 100;

      echo('new leading '+line.characterAttributes.leading+' = or '+original_leading+' x '+line.characterAttributes.verticalScale +'/'+100);

      
      return line.characterAttributes.leading;

   } else {
      //the interlineation has not changed
      
      return original_leading;
   }   
}


/* Vertical compression ratio */
function compensation(y_coord) {
   
   /**
    * Count the distance from your eyes to the line according 
    * to Pythagoras' theorem and divide by the distance to 
    * the plane to get a dimensionless value from 1 (no distortion) 
    * to infinity (very high distortion)
    */
    // echo('sqrt('+distance+'(distance)**2 + '+ y_coord+'(y_coord)**2)/'+distance+'(distance)');
    echo('dist = '+(Math.sqrt(distance * distance + y_coord * y_coord)).toFixed(2)+' cm');
    echo('angle = '+((180/Math.PI)*Math.atan(y_coord/distance)).toFixed(2)+' °');
   var coef_y = Math.sqrt(distance * distance + y_coord * y_coord) / distance;
   
   return coef_y;
}








// UI FUNCTIONS



//OK button processing
function actionOK() {
   
   echo('actionOK');

   // Store the used values for the next startup 
   from_vars_to_prefs();


   /**
    * Since the script is executed in preview mode, 
    * when you click on OK, everything is already done, 
    * you just close the panel
    */

   settings.close();
   
}


//Cancel button processing
function actionCanceled() {
   
   // Undo the changes and close the panel
   echo('onClose');
   app.undo();
   app.redraw();
   settings.close();
   
}


// Update parameters in the panel

function settings_updated() {
   

   echo('settings_updated');

   // save the new value of the variables
   distance          = settings.distPnl.titleEt.text;
   perspective_coeff = settings.perspPnl.slide.value;
   scale_coeff       = settings.scalePnl.slide.value;
   leading_coeff     = settings.leadPnl.slide.value;


   // recalculate
   app.undo();
   main();
   app.redraw();
   
}


// TODO: Make the name of the variables like everywhere else

// 1. Distance control
// Moving the slider
function distSliderChanged() {
   settings.distPnl.titleEt.text = Math.round(settings.distPnl.slide.value);
}

// Changed the text field
function distTextChanged() {
   settings.distPnl.slide.value = settings.distPnl.titleEt.text;
   settings_updated();
}


// 2. Distortion compensation coefficient control
// Moving the slider
function perspSliderChanged() {
   settings.perspPnl.titleEt.text = roundOff(settings.perspPnl.slide.value);
}

// Changed the text field
function perspTextChanged() {
   settings.perspPnl.slide.value = settings.perspPnl.titleEt.text;
   settings_updated();
}

// 3. Scale compensation coefficient control
// Moving the slider
function scaleSliderChanged() {
   settings.scalePnl.titleEt.text = roundOff(settings.scalePnl.slide.value);
}

// Changed the text field
function scaleTextChanged() {
   settings.scalePnl.slide.value = settings.scalePnl.titleEt.text;
   settings_updated();
}


// 3. Leading compensation coefficient control
// Moving the slider
function leadSliderChanged() {
   settings.leadPnl.titleEt.text = roundOff(settings.leadPnl.slide.value);
}

// Changed the text field
function leadTextChanged() {
   settings.leadPnl.slide.value = settings.leadPnl.titleEt.text;
   settings_updated();
}






// Creating a panel with settings
function build_ui(){
   

   var dlg = new Window('dialog', loc({'ru':'Компенсация искажений текста', 'en':'Compensation of text distortion'}));

   var s_w = 200;
   var ti_w = 40;
   var d_w = 29;
   var w = s_w + ti_w + 84;

   // dlg.location = [1000, 500];
   dlg.alignChildren = ["left", "top"];
   dlg.preferredSize.width = w;
   dlg.margins = 15;



   // distance 
   dlg.distPnl = dlg.add('panel', undefined, loc({'ru':'Дистанция', 'en':'Distance'}));
   dlg.distPnl.orientation = 'row';
   dlg.distPnl.preferredSize.width = w - d_w;
   // dlg.distPnl.spacing = 0; 
   dlg.distPnl.margins = 10;

   dlg.distPnl.slide = dlg.distPnl.add('slider', undefined, distance, 50, 500);   //слайдер
   dlg.distPnl.slide.preferredSize.width = s_w;

   dlg.distPnl.cm_g = dlg.distPnl.add('group', undefined, 'so');   //слайдер
   dlg.distPnl.cm_g.spacing = 4;

   dlg.distPnl.titleEt = dlg.distPnl.cm_g.add('edittext', undefined, Math.round(distance)); //ипнут
   dlg.distPnl.titleEt.preferredSize.width = ti_w;

   dlg.distPnl.titleSt = dlg.distPnl.cm_g.add('statictext', undefined, loc({'ru':'см', 'en':'cm'})); //размерность
   // dlg.distPnl.titleEt.preferredSize.width = 20; 
   dlg.distPnl.titleSt.helpTip = loc({'ru':'сантиметров', 'en':'centimeters'});




   // perspective_coeff
   dlg.perspPnl = dlg.add('panel', undefined, loc({'ru':'Компенсация перспективы', 'en':'Perspective compensation'}));
   dlg.perspPnl.orientation = 'row';
   dlg.perspPnl.preferredSize.width = w - d_w;
   dlg.perspPnl.margins = 10;

   dlg.perspPnl.slide = dlg.perspPnl.add('slider', undefined, perspective_coeff, 0, 1);//слайдер
   dlg.perspPnl.slide.preferredSize.width = s_w;
   dlg.perspPnl.titleEt = dlg.perspPnl.add('edittext', undefined, roundOff(perspective_coeff) );//инпут
   dlg.perspPnl.titleEt.preferredSize.width = ti_w;



   // scale_coeff
   dlg.scalePnl = dlg.add('panel', undefined, loc({'ru':'Компенсация размера', 'en':'Size compensation'}));
   dlg.scalePnl.orientation = 'row';
   dlg.scalePnl.preferredSize.width = w - d_w;
   dlg.scalePnl.margins = 10;

   dlg.scalePnl.slide = dlg.scalePnl.add('slider', undefined, scale_coeff, 0, 1);
   dlg.scalePnl.slide.preferredSize.width = s_w;
   dlg.scalePnl.titleEt = dlg.scalePnl.add('edittext', undefined, roundOff(scale_coeff) );
   dlg.scalePnl.titleEt.preferredSize.width = ti_w;



   // leading_coeff
   dlg.leadPnl = dlg.add('panel', undefined, loc({'ru':'Cохранение интерлиньяжа', 'en':'Leading compensation'}));
   dlg.leadPnl.orientation = 'row';
   dlg.leadPnl.preferredSize.width = w - d_w;
   dlg.leadPnl.margins = 10;

   dlg.leadPnl.slide = dlg.leadPnl.add('slider', undefined, leading_coeff, 0, 1);
   dlg.leadPnl.slide.preferredSize.width = s_w;
   dlg.leadPnl.titleEt = dlg.leadPnl.add('edittext', undefined, roundOff(leading_coeff) );
   dlg.leadPnl.titleEt.preferredSize.width = ti_w;



   // buttons panel
   dlg.btnPnl = dlg.add('group', undefined, 'Do It!');
   dlg.btnPnl.orientation = 'row';
   dlg.btnPnl.alignment = "right";
   dlg.btnPnl.alignChildren = ["left", "center"];

   dlg.btnPnl_l = dlg.btnPnl.add('group', undefined, 'LEFT');
   dlg.btnPnl_l.orientation = 'row';
   dlg.btnPnl_l.alignment = "left";
   dlg.btnPnl_l.alignChildren = ["left", "center"];
   dlg.btnPnl_l.preferredSize.width = 110;//(w-d_w-10)/4;


   dlg.btnPnl_r = dlg.btnPnl.add('group', undefined, 'RIGHT');
   dlg.btnPnl_r.orientation = 'row';
   dlg.btnPnl_r.alignment = "right";
   // dlg.btnPnl_r.preferredSize.width = (w-d_w-10)*3/4;


   //buttons
   dlg.btnPnl.buildBtn0 = dlg.btnPnl_l.add('button', undefined, loc({'ru':'Помощь', 'en':'Help'}), { name: 'help' });
   dlg.btnPnl.buildBtn0.alignment = ["left", "top"];

   dlg.btnPnl.buildBtn1 = dlg.btnPnl_r.add('button', undefined, loc({'ru':'Отмена', 'en':'Cancel'}), { name: 'cancel' });
   dlg.btnPnl.buildBtn2 = dlg.btnPnl_r.add('button', undefined, 'OK', { name: 'ok' });


   //event handlers
   dlg.btnPnl.buildBtn0.onClick = GotoLink;
   dlg.btnPnl.buildBtn1.onClick = actionCanceled;
   dlg.btnPnl.buildBtn2.onClick = actionOK;


   dlg.distPnl.slide.onChanging = distSliderChanged;
   dlg.distPnl.slide.onChange = settings_updated;
   dlg.distPnl.titleEt.onChanging = distTextChanged;

   dlg.perspPnl.slide.onChanging = perspSliderChanged;
   dlg.perspPnl.slide.onChange = settings_updated;
   dlg.perspPnl.titleEt.onChanging = perspTextChanged;

   dlg.scalePnl.slide.onChanging = scaleSliderChanged;
   dlg.scalePnl.slide.onChange = settings_updated;
   dlg.scalePnl.titleEt.onChanging = scaleTextChanged;

   dlg.leadPnl.slide.onChanging = leadSliderChanged;
   dlg.leadPnl.slide.onChange = settings_updated;
   dlg.leadPnl.titleEt.onChanging = leadTextChanged;

   
   return dlg;
}









// LET`S GO

// Create a log file
if (debug_mode) {
   //TODO: Windows support
   var logFile = "~/Desktop/perspective_log.txt";
   var log_file = new File(logFile);
   log_file.open("w");
   log_file.encoding = "UTF-8";
}

echo('start!');
echo(app.locale);

// factory_reset();
init_configs();

var settings = build_ui();

var so = main();
if(so){

   app.redraw();

   if (ui){
      echo('show');
      settings.show();
   }

}




if (debug_mode) {
   log_file.close();
}
