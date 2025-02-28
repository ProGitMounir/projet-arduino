# Projet Arduino - Système de Gestion de Maison Intelligente

Ce projet utilise un Arduino Mega 2560 pour créer un système de gestion de maison intelligente. Il permet de contrôler à distance différents appareils (lumières, ventilateurs, thermostats) à partir d'une interface web.

## 📁 Structure du Projet

Voici la structure des fichiers principaux de l'application :
![structure](https://github.com/user-attachments/assets/e49b4a20-1d24-4d84-a9c2-a403822084aa)


# 📌 Fichiers Clés

arduino.js : Gère les interactions avec l'Arduino.

mqtt-servient.js : Implémente le protocole MQTT pour la communication avec les appareils.

mqtt-serverweb.js : Serveur MQTT permettant l'interaction entre l'interface web et le système.

public/index.html : Interface utilisateur pour le contrôle à distance.
# ▶️ Test du Projet
### Pour tester le projet, exécutez les commandes suivantes dans des differents terminals :
  
    --> node arduino.js 
  
    --> node mqtt-servient.js
  
    --> node mqtt-serverweb.js 
  

# 📸 Documentation Visuelle
![smarthouse1](https://github.com/user-attachments/assets/65f8c058-3dbe-49dc-a5a6-81828feab9c9)
![smarthouse2](https://github.com/user-attachments/assets/767cbfe7-5a50-496b-95d6-945273b10218)


# 📌 Auteurs

#### 👤 ILYASS BARKOUK📧 Contact : barkoukilyass@gmail.com || ilyassBarkouk@etud.iga.ac.ma

#### 👤 MOUNIR IYA AMINE📧 Contact : pro.mailmounir@gmail.com || mounir.iyaamine@etud.iga.ac.ma

##### 📢 Remarque : Pour toute question ou suggestion, n'hésitez pas à nous contacter !" ajoute des # devant les titres cles
