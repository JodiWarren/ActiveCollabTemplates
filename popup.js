function setComment(commentData) {
    chrome.tabs.executeScript({
        code: `
        console.log("${commentData}");
    var trigger;
     if ( typeof trigger === "undefined" ) {
     trigger = document.querySelector(".object_comments_faux_controls"); 
     }
    if ( trigger ){
      trigger.click()
    } 
    window.setTimeout( ()=>{ 
      document.querySelector(".mce-content-body").innerHTML = "` + commentData + `" 
    }, 100 );
  `
    });
}

const $document = $(document);
const $form = $('.acComment');
const $steps = $('.step');
let $currentStep = null;
let isMetaDown = false;

const inputTitles = [
    {
        'name': 'tested-on',
        'title': 'Tested on:'
    },
    {
        'name': 'deployed-to',
        'title': 'Deployed to:'
    },
    {
        'name': 'link-to-commit',
        'title': 'Link to commit:'
    },
    {
        'name': 'browser-tested-on',
        'title': 'Browser tested on:'
    },
    {
        'name': 'description',
        'title': 'Description of work carried out:'
    },
    {
        'name': 'testing-steps',
        'title': 'Testing steps:'
    },
    {
        'name': 'notes',
        'title': 'Notes:'
    },
];

function encode4HTML(str) {
    return str
        .replace(/\r\n?/g,'\n')
        // normalize newlines - I'm not sure how these
        // are parsed in PC's. In Mac's they're \n's
        .replace(/(^((?!\n)\s)+|((?!\n)\s)+$)/gm,'')
        // trim each line
        .replace(/(?!\n)\s+/g,' ')
        // reduce multiple spaces to 2 (like in "a    b")
        .replace(/^\n+|\n+$/g,'')
        // trim the whole string
        .replace(/[<>&"']/g,function(a) {
            // replace these signs with encoded versions
            switch (a) {
                case '<'    : return '&lt;';
                case '>'    : return '&gt;';
                case '&'    : return '&amp;';
                case '"'    : return '&quot;';
                case '\''   : return '&apos;';
            }
        })
        .replace(/\n{2,}/g,'</p><p>')
        // replace 2 or more consecutive empty lines with these
        .replace(/\n/g,'<br />')
        // replace single newline symbols with the <br /> entity
        .replace(/^(.+?)$/,'<p>$1</p>');
    // wrap all the string into <p> tags
    // if there's at least 1 non-empty character
}

function formatData(serialisedForm) {
    return serialisedForm.reduce((formText, thisItem) => {
        console.log(thisItem);
        const title = inputTitles.filter( i => {
            return i.name === thisItem.name;
        } );
        const encoded = $('<div/>').text(thisItem.value).html();
        console.log(encoded);
        return formText + "<strong>" + title[0].title + "</strong><br>" + encode4HTML(encoded) + "<br>";
    }, '');
}

function nextStep($step){
    if ($step.hasClass('step--last')) {
        const serialisedForm = $form.serializeArray();
        const formattedData = formatData(serialisedForm);
        setComment(formattedData);
        return;
    }

    startStep($step.next('.step'));
}

function getInitials($step) {
    const $inputs = $step.find('input[type=radio]');
    return $inputs.map( (index, element) => {
        return $(element).siblings('strong')[0].innerHTML;
    } ).get();
}

function watchRadio(event) {
    const initials = getInitials($currentStep);
    if (event.key && (initials.indexOf(event.key.toUpperCase()) > -1)) {
        event.preventDefault();
        const elIndex = initials.indexOf(event.key.toUpperCase());
        $currentStep
            .find('input')
            .eq(elIndex)
            .prop("checked", true);
        $document.off('keydown', watchRadio);
        nextStep($currentStep);
    }
}

function watchTextArea(event) {
    if (event.key && event.key === 'Meta'){
        isMetaDown = true;
    }

    if (event.key && event.key === 'Enter' && isMetaDown === true){
        event.preventDefault();
        $document.off('keydown', watchTextArea);
        nextStep($currentStep);
    }
}
function watchMetaUp(event) {
    if (event.key && event.key === 'Meta') {
        isMetaDown = false;
    }
}

function watchInput(event) {
    if (event.key && event.key === 'Enter'){
        event.preventDefault();
        $document.off('keydown', watchInput);
        nextStep($currentStep);
    }
}

function startStep($step) {
    $steps.removeClass('active');
    $step.addClass('active');
    $currentStep = $step;
    if ($step.hasClass('step--options')) {
        $document.on('keydown', watchRadio);
        $step.on('click', 'input[type="radio"]', () => {
            nextStep($step);
        });
    } else if ($step.hasClass('step--textarea')) {
        $step.find('textarea')
            .first()
            .focus();
        $document.on('keydown', watchTextArea);
        $document.on('keyup', watchMetaUp);
    } else {
        $step.find('input')
            .first()
            .focus();
        $document.on('keydown', watchInput);
    }
}

const button = document.querySelector('.fileComment');
button.addEventListener('click', e => {
    e.preventDefault();
    button.hidden = true;
    document.querySelector('.acComment').hidden = false;

    startStep($steps.first());
});
