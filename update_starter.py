import re

html_to_inject = """function getStarterHeroHTML() {
      return `
        <div class="welcome-hero" contenteditable="false" style="padding:0; margin:0; height:100%; display:flex; font-family:'Segoe UI', sans-serif;">
          
          <!-- Left Sidebar -->
          <div style="width: 240px; background: #2b579a; color: white; padding: 20px 0; display: flex; flex-direction: column; gap: 8px;">
            <div style="font-size: 24px; font-weight: 600; padding: 0 20px 20px 20px; display: flex; align-items: center; gap: 12px;">
              <div style="background: white; color: #2b579a; width: 32px; height: 32px; border-radius: 4px; display: flex; justify-content: center; align-items: center; font-size: 18px; font-weight: bold;">W</div>
              Word Studio
            </div>
            
            <div style="padding: 12px 24px; background: rgba(255,255,255,0.15); border-left: 4px solid white; cursor: pointer; display: flex; align-items: center; gap: 14px; font-weight: 500;">
              <i class="fa-solid fa-house"></i> Home
            </div>
            <div onclick="startFreshBlank()" style="padding: 12px 24px; cursor: pointer; display: flex; align-items: center; gap: 14px; font-weight: 500; opacity: 0.8; transition: 0.2s;" onmouseover="this.style.opacity='1'; this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.opacity='0.8'; this.style.background='transparent'">
              <i class="fa-solid fa-file-circle-plus"></i> New
            </div>
            <div onclick="openDocPrompt()" style="padding: 12px 24px; cursor: pointer; display: flex; align-items: center; gap: 14px; font-weight: 500; opacity: 0.8; transition: 0.2s;" onmouseover="this.style.opacity='1'; this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.opacity='0.8'; this.style.background='transparent'">
              <i class="fa-solid fa-folder-open"></i> Open
            </div>
            
            <div style="flex: 1;"></div>
            
            <div onclick="openExamExtractorModal()" style="padding: 12px 24px; cursor: pointer; display: flex; align-items: center; gap: 14px; font-weight: 500; opacity: 0.8; background: rgba(0,0,0,0.15); border-top: 1px solid rgba(255,255,255,0.1);" title="JEE / GATE PDF Question Extractor">
              <i class="fa-solid fa-graduation-cap"></i> Extractor Tool
            </div>
          </div>

          <!-- Main Content Area -->
          <div style="flex: 1; background: #f3f2f1; padding: 40px 50px; overflow-y: auto;">
            <h1 style="font-size: 28px; font-weight: 300; color: #323130; margin: 0 0 30px 0;">New</h1>
            
            <div style="display: flex; gap: 24px; margin-bottom: 40px; flex-wrap: wrap;">
              <!-- Blank Document -->
              <div onclick="startFreshBlank()" style="cursor: pointer; width: 180px;">
                <div style="width: 180px; height: 240px; background: white; border: 1px solid #c8c6c4; box-shadow: 0 2px 4px rgba(0,0,0,0.05); transition: 0.2s; display: flex; justify-content: center; align-items: center; margin-bottom: 12px;" onmouseover="this.style.borderColor='#2b579a'; this.style.boxShadow='0 4px 8px rgba(0,0,0,0.1)'" onmouseout="this.style.borderColor='#c8c6c4'; this.style.boxShadow='0 2px 4px rgba(0,0,0,0.05)'">
                   <div style="width: 100px; height: 140px; border: 1px dashed #a19f9d; display: flex; justify-content: center; align-items: center; color: #2b579a; font-size: 32px;">
                      <i class="fa-solid fa-plus"></i>
                   </div>
                </div>
                <div style="font-weight: 600; font-size: 14px; color: #323130; text-align: center;">Blank document</div>
              </div>
              
              <!-- Resume Template -->
              <div onclick="loadTemplate('resume')" style="cursor: pointer; width: 180px;">
                <div style="width: 180px; height: 240px; background: white; border: 1px solid #c8c6c4; box-shadow: 0 2px 4px rgba(0,0,0,0.05); transition: 0.2s; padding: 20px; box-sizing: border-box; display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px;" onmouseover="this.style.borderColor='#2b579a'; this.style.boxShadow='0 4px 8px rgba(0,0,0,0.1)'" onmouseout="this.style.borderColor='#c8c6c4'; this.style.boxShadow='0 2px 4px rgba(0,0,0,0.05)'">
                   <div style="height: 12px; background: #e1dfdd; width: 60%; margin-bottom: 10px;"></div>
                   <div style="height: 6px; background: #f3f2f1; width: 100%;"></div>
                   <div style="height: 6px; background: #f3f2f1; width: 80%;"></div>
                   <div style="height: 6px; background: #f3f2f1; width: 90%;"></div>
                   <div style="height: 6px; background: #f3f2f1; width: 85%; margin-bottom: 10px;"></div>
                   <div style="height: 6px; background: #f3f2f1; width: 100%;"></div>
                   <div style="height: 6px; background: #f3f2f1; width: 70%;"></div>
                </div>
                <div style="font-weight: 600; font-size: 14px; color: #323130; text-align: center;">Professional Resume</div>
              </div>
              
              <!-- Assignment Template -->
              <div onclick="loadTemplate('assignment')" style="cursor: pointer; width: 180px;">
                <div style="width: 180px; height: 240px; background: white; border: 1px solid #c8c6c4; box-shadow: 0 2px 4px rgba(0,0,0,0.05); transition: 0.2s; padding: 20px; box-sizing: border-box; display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px;" onmouseover="this.style.borderColor='#2b579a'; this.style.boxShadow='0 4px 8px rgba(0,0,0,0.1)'" onmouseout="this.style.borderColor='#c8c6c4'; this.style.boxShadow='0 2px 4px rgba(0,0,0,0.05)'">
                   <div style="height: 18px; background: #e1dfdd; width: 100%; margin-bottom: 16px;"></div>
                   <div style="height: 8px; background: #f3f2f1; width: 100%;"></div>
                   <div style="height: 8px; background: #f3f2f1; width: 100%;"></div>
                   <div style="height: 8px; background: #f3f2f1; width: 100%;"></div>
                   <div style="height: 8px; background: #f3f2f1; width: 60%;"></div>
                </div>
                <div style="font-weight: 600; font-size: 14px; color: #323130; text-align: center;">Lab Assignment</div>
              </div>
            </div>

            <h2 style="font-size: 18px; font-weight: 400; color: #323130; margin: 0 0 20px 0;">Recent</h2>
            <div style="background: white; border: 1px solid #e1dfdd; border-radius: 4px; padding: 20px; text-align: center; color: #605e5c; font-size: 14px;">
               <i class="fa-solid fa-clock-rotate-left" style="font-size: 24px; margin-bottom: 12px; color: #a19f9d; display: block;"></i>
               You haven't opened any documents recently.<br>
               <a href="#" onclick="openDocPrompt()" style="color: #2b579a; text-decoration: none; font-weight: 600; display: inline-block; margin-top: 8px;">Browse files</a>
            </div>
          </div>
        </div>
        <p style="text-align: left; display: none;"><br></p>
      `;
    }"""

with open('/Users/ramji/Desktop/ms-word-clone/index.html', 'r') as f:
    text = f.read()

pattern = re.compile(r'function getStarterHeroHTML\(\)\s*\{.*?\n\s*\}\s*$', re.MULTILINE | re.DOTALL)
new_text = pattern.sub(html_to_inject, text)

with open('/Users/ramji/Desktop/ms-word-clone/index.html', 'w') as f:
    f.write(new_text)

print("Updated getStarterHeroHTML")
