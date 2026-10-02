import re

html_code = """
      // High-precision patterns: matches Q1, Q.1, Problem 1, Question 1, Gate question patterns
      const qNumRegex = /^(Q\\.?\\s*\\d+|Question\\s*\\d+|Problem\\s*\\d+|\\bQ\\s*\\d+|\\d+[\\.\\)])\\s*(.*)/i;
      const mcqOptionRegex = /\\([A-D]\\)|\\b\\[[A-D]\\]|\\b[A-D][\\.\\)]\\s+|\\b(Option\\s*[A-D]|Ans|Answer\\s*:)/i;
      const mathFormulaRegex = /[∫∑√±=≤≥≠∞λπθΔ]|\\b(lim|log|sin|cos|tan|det|matrix|dx|dt|d\\/dx|dy\\/dx|keV|MeV|mol|kg|m\\/s)\\b/i;
      const questionWordRegex = /\\b(what|why|how|calculate|find|determine|evaluate|solve|which|prove)\\b/i;

      extractedQuestionsList = [];
      let currentQ = '';
      let linesInCurrentQ = 0;

      rawBlocks.forEach((block) => {
        const isNewQ = qNumRegex.test(block) || (block.endsWith('?') && block.length < 200);
        const hasOptions = mcqOptionRegex.test(block);
        const hasFormula = mathFormulaRegex.test(block);
        
        // If a block looks like a brand new question
        if (isNewQ) {
          if (currentQ.trim()) extractedQuestionsList.push(currentQ.trim());
          currentQ = block;
          linesInCurrentQ = 1;
        } 
        // If we are currently building a question, append to it
        else if (currentQ) {
          // Stop appending if it gets too long (likely not part of the question anymore)
          // or if it's a completely unrelated long paragraph
          if (linesInCurrentQ > 15 || (block.length > 300 && !hasOptions)) {
            extractedQuestionsList.push(currentQ.trim());
            currentQ = '';
            linesInCurrentQ = 0;
          } else {
            currentQ += '\\n' + block;
            linesInCurrentQ++;
          }
        } 
        // If we are NOT building a question, but this block looks like a standalone formula or option
        else if (!currentQ && (hasOptions || (hasFormula && block.length < 100))) {
          extractedQuestionsList.push(block);
        }
      });
      if (currentQ.trim()) extractedQuestionsList.push(currentQ.trim());

      // If specific filter selected
      if (type === 'mcq') {
        extractedQuestionsList = extractedQuestionsList.filter(q => mcqOptionRegex.test(q));
      } else if (type === 'numerical') {
        extractedQuestionsList = extractedQuestionsList.filter(q => !mcqOptionRegex.test(q) && (/\\d+/.test(q) || mathFormulaRegex.test(q)));
      } else if (type === 'formulas') {
        extractedQuestionsList = extractedQuestionsList.filter(q => mathFormulaRegex.test(q));
      }

      // If strict filter found too few, fallback gracefully
      if (!extractedQuestionsList.length) {
         // Instead of dumping the whole document, try to find blocks that look like questions based on keywords
         let fallback = rawBlocks.filter(b => b.endsWith('?') || questionWordRegex.test(b) || mathFormulaRegex.test(b));
         if (fallback.length > 25) fallback = fallback.slice(0, 25);
         
         // If still nothing, just give up cleanly rather than dumping gibberish
         if (!fallback.length && rawBlocks.length > 0) {
            fallback = rawBlocks.slice(0, 10);
         }
         extractedQuestionsList = fallback;
      }
"""

with open('/Users/ramji/Desktop/ms-word-clone/index.html', 'r') as f:
    text = f.read()

# Locate the old logic
start_marker = "// High-precision patterns: matches Q1, Q.1, Problem 1, Question 1, Gate question patterns"
end_marker = "countEl.innerText = `${extractedQuestionsList.length} items extracted`;"

start_idx = text.find(start_marker)
end_idx = text.find(end_marker)

if start_idx != -1 and end_idx != -1:
    new_text = text[:start_idx] + html_code + "\n      " + text[end_idx:]
    with open('/Users/ramji/Desktop/ms-word-clone/index.html', 'w') as f:
        f.write(new_text)
    print("Extraction logic replaced")
else:
    print("Could not find markers")
