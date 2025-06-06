# CSP B Gone
[<img src="https://blog.mozilla.org/addons/files/2020/04/get-the-addon-fx-apr-2020.svg" alt="for Firefox" height="60px">](https://addons.mozilla.org/en-US/firefox/addon/csp-b-gone/)

![Mozilla Add-on Stars](https://img.shields.io/amo/stars/csp-b-gone)
![Mozilla Add-on Version](https://img.shields.io/amo/v/csp-b-gone)

This addon check the CSP of the current website against a list of known bypasses. You can also use the search bar to check if a specific domain has a known CSP bypass. 

# Popup
The image below shows the extension popup which has three parts. The middle field which says "defaul-src" is the current page's CSP policy. The bottom two boxes are validated CSP bypasses which will work on the current page. The top search bar allows you to search for CSP bypasses of other domains. 
<p align="center">
  <img src="https://github.com/user-attachments/assets/64089b2c-f3d6-4e4b-8d61-d9e73361be6d" alt="GUI">
</p>

# How Does a CSP Bypass Work?
The most common way to bypass CSP is by finding a JSONP endpoint on a trusted domain within the CSP. <a href=https://dev.to/benregenspan/the-state-of-jsonp-and-jsonp-vulnerabilities-in-2021-52ep>JSONP</a> takes advantage of the fact that the same-origin policy does not prevent execution of external `<script>` tags. Usually, a `<script src="some/js/file.js">` tag represents a static script file. But you can just as well create a dynamic API endpoint, say `/userdata. jsonp`, and have it behave as a script by accepting a query parameter (such as `?callback=CALLBACK`). 

JSONP endpoints used to bypass CSP are discovered by querying the archive.org database on a monthly basis for URLs with a common feature set. Each suspected URL is injected into a script src element inside a headless browser with the `alert()` function hooked. If an alert box fires then the URL is a confirmed JSONP endpoint and added to the GitHub list <a href=https://github.com/ACK-J/CSP-B-Gone/blob/main/data.tsv>HERE</a>.

This extension takes inspiration from <a href=https://cspbypass.com>cspbypass.com</a> but includes a much larger database of bypasses. Cspbypass.com focuses on bypasses for the top 1,000 sites while this extension attempts to collect any and all CSP bypasses possible.

# When Would I Need a CSP Bypass?
A Content Security Policy (CSP) bypass may be necessary in specific scenarios, typically related to web security testing or development. CSP is a security feature that helps prevent a range of attacks like Cross-Site Scripting (XSS), data injection attacks, and clickjacking by controlling which resources the browser is allowed to load and execute. 

# Credits
This extension was hevaily inspired by the great work done by @renniepak for cspbypass.com and all of the contributors listed below:

Gareth Heyes, Eduardo Vela, kevin_mizu, ajxchapman, YoeriVegt, IvarsVids, Panya, w9w, notdenied, renniepak, ldionmarcil, joaxcar, HackerOn2Wheels, omidxrz, realansgar, renwax23

## Donations 
- Monero Address: `89jYJvX3CaFNv1T6mhg69wK5dMQJSF3aG2AYRNU1ZSo6WbccGtJN7TNMAf39vrmKNR6zXUKxJVABggR4a8cZDGST11Q4yS8`

## Terms of Service
By using CSP-B-Gone, you agree to use it solely for lawful and ethical purposes, specifically for authorized penetration testing and security research with the explicit, written consent of the system owner. Unauthorized use of this tool against third-party systems without permission is strictly prohibited and may constitute a violation of local, national, or international laws. You are solely responsible for ensuring your use complies with all applicable regulations. The developers and distributors of CSP-B-Gone disclaim all liability for any misuse or damage resulting from its use and provide the tool “as-is” without warranties of any kind. By using the tool, you agree to indemnify and hold harmless its creators from any claims, damages, or legal consequences arising from your actions. Continued use of the tool following any updates to these terms constitutes your acceptance of the revised Terms of Service.
