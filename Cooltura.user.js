// ==UserScript==
// @name	Cooltura choice
// @description	Choice of ingredients
// @include	https://www.pizza-cool.cz/category.aspx?*
// @version	1
// @require	https://ajax.googleapis.com/ajax/libs/jquery/3.4.1/jquery.min.js
// @grant    none
// ==/UserScript==

let allIngredients = [];
$('.desc').each( function () {
    let ingredients = $(this).text().split(",");
    ingredients.pop();
    console.log(ingredients)
    for(let i=0; i < ingredients.length; i++){
        let ingredient = getIngredient(ingredients[i]);
        if(ingredient) {
            if(Array.isArray(ingredient)){
                for(let j=0; j < ingredient.length; j++){
                    allIngredients.push(ingredient[j]);
                }
            }else
                allIngredients.push(ingredient);
        }
    }
});

let ingredientsMatrix = [];
ingredientsMatrix.push([]);
function addIngredientToMatrix(ingredient){
    for(let i=0; i < ingredientsMatrix.length; i++){
        for(let j=0; j < ingredientsMatrix[i].length; j++)
        if(ingredient === ingredientsMatrix[i][j]){
            if(ingredientsMatrix.length < (i+2))
                ingredientsMatrix.push([]);
            ingredientsMatrix[i+1].push(ingredient);
            ingredientsMatrix[i].splice(j, 1);
            return;
        }
    }
    ingredientsMatrix[0].push(ingredient);
}

for(let i=0; i < allIngredients.length; i++){
    addIngredientToMatrix(allIngredients[i]);
}


let myContent = $('<div></div>');
let count = 1;
for(let i= ingredientsMatrix.length - 1; i >= 0; i--){
    for(let j=0; j<ingredientsMatrix[i].length; j++){
        let ch = $('<input type="checkbox" id="ingredient'+ count +'" data-ingredient="' + ingredientsMatrix[i][j] + '"><label for="ingredient'+ count +'">' + ingredientsMatrix[i][j] + '(' + (i+2) + ')</label>');
        myContent.append(ch);
        count++;
    }
}
myContent.insertAfter($('#content_header'))

//$('.items').find('.cleaner').last().show();
let myIngredients = [];
myContent.find('input[type="checkbox"]').change(function(){
    let el = $(this);
    if(el.prop("checked")){
        myIngredients.push(el.data("ingredient"));
    }else{
        let ingredient = el.data("ingredient");
        for(let i=0; i < myIngredients.length; i++){
            if(ingredient === myIngredients[i])
                myIngredients.splice(i,1);
        }
    }
    $('.item').removeClass('selected');
    $('.addToCart').hide();
    $('.desc').each( function () {
        let hasMyIngredients = true;
        for(let i=0; i < myIngredients.length; i++){
            if(!haveIngredient(myIngredients[i], this)){
                hasMyIngredients = false;
                break;
            }
        }
        if(hasMyIngredients)
            $(this).parent().show();
        else
            $(this).parent().hide();
    });

    console.log($('.items').find('.cleaner').length)
   $('.items').find('.cleaner').each(function(){
       if(!$(this).text())
           $(this).remove();
   });
      let counter = 0;
     $('.item').each( function (index) {
         if($(this).is(':visible')) {
             counter++;
             if(counter > 0 && counter % 4 === 0)
                 $('<div class="cleaner"></div>').insertAfter(this);
         }
     });
     $('<div class="cleaner"></div>').insertAfter($('.item').last());

});

function haveIngredient(needIngredient, el){
    let ingredients = $(el).text().split(",");
    if(ingredients.length === 1)
        return true;
    else
        ingredients.pop();
    for(let i=0; i < ingredients.length; i++){
        let ingredient = getIngredient(ingredients[i]);
        if(Array.isArray(ingredient)){
            for(let j=0; j < ingredient.length; j++){
                if (ingredient[j] === needIngredient)
                    return true;
            }
        }else {
            if (ingredient === needIngredient)
                return true;
        }
    }
    return false;
}

function getIngredient(str){
    let find = '1/4';
    let re = new RegExp(find, 'g');
    let ingredient = str.replace(re, '').replace(/,/g, '').trim();
    if(ingredient === "om.červená cibule" || !ingredient)
        return false;
    if(ingredient === "bbq")
        ingredient = "bbq om."
    if(ingredient === "černé olivy.")
        ingredient = "černé olivy"
    if(ingredient === "drcená rajč." || ingredient === "drc.rajčata")
        ingredient = "drcená rajčata"
    if(ingredient === "rukola.")
        ingredient = "rukola"
    if(ingredient === "oregáno.")
        ingredient = "oregáno"
    if(ingredient === "červená cib.")
        ingredient = "červená cibule"
    if(ingredient === "proscuito crudo")
        ingredient = "prosciutto crudo"
    if(ingredient === "plísńový sýr")
        ingredient = "plísňový sýr"
    if(ingredient === "mozzarela")
        ingredient = "mozzarella"
    if(ingredient === "kremový základ")
        ingredient = "krémový základ"
    if(ingredient === "salám ventricina picante" || ingredient === "ventricino picanto")
        ingredient = "ventricina piccante";
    if(ingredient === "salám chorizo pamplona")
        ingredient = "chorizo pamplona";
    if(ingredient === "mleté maso.oregáno"){
        ingredient = [];
        ingredient.push("mleté maso")
        ingredient.push("oregáno")
    }
    //Sýry
    if(ingredient === "eidam"){
        ingredient = [];
        ingredient.push("sýr")
        ingredient.push("eidam")
    }
    if(ingredient === "niva"){
        ingredient = [];
        ingredient.push("sýr")
        ingredient.push("niva")
    }
    if(ingredient === "uzený sýr"){
        ingredient = [];
        ingredient.push("sýr")
        ingredient.push("uzený sýr")
    }
    if(ingredient === "mozzarella"){
        ingredient = [];
        ingredient.push("sýr")
        ingredient.push("mozzarella")
    }
    if(ingredient === "hermelín"){
        ingredient = [];
        ingredient.push("sýr")
        ingredient.push("hermelín")
    }
    //Šunka
    if(ingredient.includes("šunka") || ingredient === "prosciutto crudo"){
        if(ingredient === "šunka")
            return ingredient;
        let ingr = ingredient;
        ingredient = [];
        ingredient.push("šunka")
        ingredient.push(ingr)
    }
    //Salám
    if(ingredient === "paprikáš"){
        ingredient = [];
        ingredient.push("salám")
        ingredient.push("paprikáš")
    }
    if(ingredient === "vysočina"){
        ingredient = [];
        ingredient.push("salám")
        ingredient.push("vysočina")
    }
    if(ingredient === "ventricina piccante"){
        ingredient = [];
        ingredient.push("salám")
        ingredient.push("ventricina piccante")
    }
    if(ingredient === "chorizo pamplona"){
        ingredient = [];
        ingredient.push("salám")
        ingredient.push("chorizo pamplona")
    }
    return ingredient;
}